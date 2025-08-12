
const fetch = require("node-fetch");
const puppeteer = require("puppeteer");
const moment = require("moment");

class EvaService {
  constructor() {
    this.fetch        = fetch;
    this.ready        = false;
    this.status       = "init";
    this.results      = [];
    this.cache        = {};
    this.accessToken  = "";
    this.refreshToken = "";
    this.antiguedad   = Number(process.env.EVA_ANTIGUEDAD) || 3;
    this.email        = process.env.EVA_EMAIL;
    this.password     = process.env.EVA_PASSWORD;
    this.empresasBaseUrl    = "https://empresas.evaluatest.com/";
    this.apiEmpresasBaseUrl = "https://apiempresas.evaluatest.com/";
    this.logs = [];
    this._log("EvaService constructed");

    setImmediate(() => this._start());
  }

  _log(msg) {
    const line = `[${new Date().toISOString()}] ${msg}`;
    this.logs.push(line);
    if (this.logs.length > 200) this.logs.shift();
    console.log(line);
    if (msg.startsWith("status=")) this.status = msg.split("=")[1];
  }
  getLogTail() { return this.logs.slice(-80); }

  // === Browser/Page Guards & Session Expiry ===
  async ensureBrowser() {
    if (!this.browser || !this.browser.isConnected?.() || this.browser.process?.() == null) {
      this._log("ensureBrowser: browser not present, launching...");
      this.browser = await puppeteer.launch({
        headless: true,
        args: [
          "--ignore-certificate-errors",
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-accelerated-2d-canvas",
          "--disable-gpu",
          "--unlimited-storage",
          "--disable-dev-shm-usage",
          "--disable-crash-reporter",
          "--disable-breakpad",
        ],
      });
      this._log("ensureBrowser: launched new browser");
    }
  }

  async ensurePage() {
    await this.ensureBrowser();
    try {
      // If page is not initialized or closed, create new one
      if (!this.page || this.page.isClosed?.()) {
        if (this.page && this.page.isClosed?.()) {
          this._log("ensurePage: page was closed, replacing...");
        }
        this.page = await this.browser.newPage();
        await this.page.setUserAgent(
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0 Safari/537.36"
        );
        this.page.setDefaultTimeout(45000);

        // Always begin at empresas base for new page to ensure correct session context
        await this.page.goto(this.empresasBaseUrl, {
          waitUntil: ["domcontentloaded", "load"],
          timeout: 0,
        });
        this._log("ensurePage: created and initialized page");
      }
    } catch (error) {
      this._log("ensurePage: error recreating page: " + (error && error.message ? error.message : error));
      throw error;
    }
  }

  async _eval(fn, ...args) {
    await this.ensurePage();
    try {
      const src = `(${fn.toString()})`;
      const preview = src.length > 420 ? `${src.slice(0, 420)}…` : src;
      this._log(`evaluate: ${preview}`);
    } catch (_) {
      this._log("evaluate: <unable to preview function source>");
    }
    // Mask argument shapes for logs
    const maskedArgs = args.map((a) => {
      if (typeof a === "string") {
        // Mask secrets/tokens
        if (a.length > 20) return `${a.slice(0, 6)}…${a.slice(-4)}`;
        return a;
      }
      if (a && typeof a === "object") {
        try { return { _keys: Object.keys(a).slice(0, 12) }; } catch { return { _type: "object" }; }
      }
      return a;
    });
    this._log(`evaluate args: ${JSON.stringify(maskedArgs)}`);
    return this.page.evaluate(fn, ...args);
  }

  _isSessionExpired(result) {
    // a) HTTP/structured error indicating 401/403
    if (result && typeof result === "object") {
      // Possible shape: { Message: "...invalid..." } (Evaluatest's 401 as JSON)
      if (
        (result.Message && typeof result.Message === "string" && result.Message.match(/token|autorizaci[óo]n|expired|inval/i)) ||
        (result.error && typeof result.error === "string" && result.error.match(/401|403|token|autorizaci[óo]n|expired|inval/i))
      ) return true;
      // Explicit mark from evaluation wrapper
      if (result.__eva_http_401 || result.__eva_http_403) return true;
    }
    // b) result is string containing session error message
    if (typeof result === "string" && result.match(/token.*(expirado|expired|invalid|no autorizado|unauthorize)/i)) {
      return true;
    }
    return false;
  }

  async _tryLogout() {
    try {
      await this.ensurePage();
      // GET /api/logout from page context
      const logoutEval = async function(empBase) {
        try {
          await window.fetch(empBase + "api/logout", { method: "GET", credentials: "include" });
          return true;
        } catch { return false; }
      };
      await this.page.evaluate(logoutEval, this.empresasBaseUrl);
      this._log("logout: logout attempt done");
    } catch (e) {
      this._log("logout: failed: " + (e && e.message ? e.message : e));
    }
  }

  async _withReauth(runOnce) {
    // Try initial call.
    let result = await runOnce();
    if (!this._isSessionExpired(result)) return result;

    this._log("Session appears expired (1st try), attempting logout and re-login...");
    await this._tryLogout();
    this._log("Session expired. Logging in again...");
    await this.login();

    // Try again after reauth
    result = await runOnce();
    if (!this._isSessionExpired(result)) {
      this._log("Session refreshed, call succeeded after re-login.");
      return result;
    }
    throw new Error("Token/session invalid after re-login. Aborting call.");
  }

  getUsers() {
    if (!this.ready) {
      this._log("getUsers called before ready (status=" + this.status + ")");
      throw new Error("Service not ready");
    }
    const mapped = this.results.map(u => ({
      CID:    u.CID,
      JID:    u.JID,
      nombre: u.N,
      puesto: u.puesto ?? "",
      correo: u.M,
      estado: u.D,
      link:   `/api/users/${u.CID}/report`
    }));
    if (!this._loggedSample && mapped.length) {
      this._loggedSample = true;
      console.log("DEBUG: Sample EVA user object from EvaService.getUsers():\n", JSON.stringify(mapped[0], null, 2));
    }
    this._log("getUsers returned " + this.results.length + " users");
    return mapped;
  }

  getStatus() {
    return { ready: this.ready, status: this.status, users: this.results.length };
  }

  async _start() {
    try {
      this._log("status=init");
      this._log("Launching Puppeteer");
      await this.init();
      this._log("Puppeteer ready, logging in...");
      await this.login();
      this._log("Login ok, fetching candidates (precargar)...");
      await this.precargar();
      this.ready = true;
      this.status = "ready";
      this._log("EvaService READY. Candidates cached: " + this.results.length);
    } catch (err) {
      this._log("status=error EvaService FATAL ERROR: " + (err && err.message ? err.message : err));
      this.ready = false;
      this.status = "error";
    }
  }

  async init() {
    this._log("puppeteer.launch starting...");
    await this.ensureBrowser();
    this._log("Puppeteer browser launched, creating newPage...");
    await this.ensurePage();
    this._log("Puppeteer page ready. Next: login...");
  }

  async login() {
    await this.ensurePage();

    // Always try to clear cookies/storage best effort
    try {
      // clear cookies
      const client = await this.page.target().createCDPSession();
      await client.send("Network.clearBrowserCookies");
      // localStorage/sessionStorage
      await this.page.evaluate(() => {
        try {
          if (window.localStorage) window.localStorage.clear();
        } catch {}
        try {
          if (window.sessionStorage) window.sessionStorage.clear();
        } catch {}
        try {
          if (window.document && window.document.cookie) {
            const cookies = document.cookie.split(";") || [];
            for (const c of cookies) {
              const eq = c.indexOf("=");
              const name = eq > -1 ? c.substr(0, eq) : c;
              document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;";
            }
          }
        } catch {}
      });
      this._log("Cleared cookies/storage");
    } catch (e) {
      this._log("Failed to clear storage: " + (e && e.message ? e.message : e));
    }

    this._log("Navigating to Evaluatest login page...");
    await this.page.goto(this.empresasBaseUrl, {
      waitUntil: ["domcontentloaded", "load"],
      timeout: 0,
    });
    await this.page.type('input[name="Email"]', this.email);
    await this.page.type('input[name="Password"]', this.password);

    await this.page.waitForSelector('button[type="submit"]');
    await this.page.keyboard.press("Enter");

    let dataObj = undefined;

    // wait for /api/authorization as XHR with fallback to polling localStorage
    try {
      this._log("Waiting for /api/authorization response...");
      const response = await this.page.waitForResponse(
        (resp) => resp.url().includes("/api/authorization"),
        { timeout: 5000 }
      );
      dataObj = await response.json();
      if (!dataObj.access_token) throw new Error("No access token in response");
      this.accessToken  = dataObj.access_token;
      this.refreshToken = dataObj.refresh_token;
      this._log("Got accessToken (network)");
      return this.accessToken;
    } catch (e) {
      this._log("Network login failed, trying localStorage polling...");
      // Poll localStorage.authorization up to ~30s with 300ms intervals
      let tries = 0, maxTries = 100;
      while (tries++ < maxTries) {
        try {
          // Standalone, closure-free for evaluate
          const pollLocalStorage = function () {
            try {
              var raw = (window && window.localStorage ? window.localStorage.getItem("authorization") : null) || "{}";
              return JSON.parse(raw);
            } catch (err) {
              return {};
            }
          };
          dataObj = await this._eval(pollLocalStorage);
          if (dataObj && dataObj.access_token) {
            this.accessToken  = dataObj.access_token;
            this.refreshToken = dataObj.refresh_token;
            this._log("Got accessToken from localStorage after submit/poll");
            return this.accessToken;
          }
        } catch {}
        await new Promise((resolve) => setTimeout(resolve, 300 + Math.floor(Math.random()*60)));
      }
      this._log("Failed to get access token after login attempt (network and localStorage polling failed)");
      throw new Error("Failed to get access token after login");
    }
  }

  async get(apiPath, useApi = false, headers = {}) {
    // Token-dependent: always handled via _withReauth.
    await this.ensurePage();

    const doFetch = async () => {
      if (!this.accessToken) {
        await this.login();
      }
      // Use window.fetch inside browser context, build headers within closure
      const evalFn = async function(token, url, extraHeaders) {
        try {
          var base = {
            accept: "application/json,text/plain,*/*",
            authorization: "Bearer " + String(token || ""),
            "content-type": "application/json"
          };
          var merged = {};
          var k;
          for (k in base) { if (Object.prototype.hasOwnProperty.call(base, k)) { merged[k] = base[k]; } }
          if (extraHeaders && typeof extraHeaders === "object") {
            for (k in extraHeaders) { if (Object.prototype.hasOwnProperty.call(extraHeaders, k)) { merged[k] = extraHeaders[k]; } }
          }
          var res = await window.fetch(String(url), { method: "GET", headers: merged });
          var ct = (res && res.headers && res.headers.get) ? res.headers.get("content-type") : null;
          // 401/403: signal to Node
          if (res.status === 401) return { __eva_http_401: true };
          if (res.status === 403) return { __eva_http_403: true };
          if (ct && ct.indexOf("application/json") !== -1) {
            return res.json();
          }
          return res.text();
        } catch (err) {
          return { __eva_error: true, message: String(err && err.message ? err.message : err) };
        }
      };
      const url = `${useApi ? this.apiEmpresasBaseUrl : this.empresasBaseUrl}${apiPath}`;
      const out = await this._eval(evalFn, this.accessToken, url, headers);
      if (out && out.__eva_error) {
        throw new Error("Page evaluate GET failed: " + out.message);
      }
      return out;
    };

    return await this._withReauth(doFetch);
  }

  async post(apiPath, payload = {}, useApi = false, headers = {}) {
    // (Not used in current flows, but for completeness)
    await this.ensurePage();

    const doPost = async () => {
      if (!this.accessToken) {
        await this.login();
      }
      const evalPost = async function(token, url, extraHeaders, bodyObj) {
        try {
          var base = {
            accept: "application/json,text/plain,*/*",
            authorization: "Bearer " + String(token || ""),
            "content-type": "application/json"
          };
          var merged = {};
          var k;
          for (k in base) { if (Object.prototype.hasOwnProperty.call(base, k)) { merged[k] = base[k]; } }
          if (extraHeaders && typeof extraHeaders === "object") {
            for (k in extraHeaders) { if (Object.prototype.hasOwnProperty.call(extraHeaders, k)) { merged[k] = extraHeaders[k]; } }
          }
          var res = await window.fetch(String(url), {
            method: "POST", headers: merged, body: JSON.stringify(bodyObj)
          });
          var ct = (res && res.headers && res.headers.get) ? res.headers.get("content-type") : null;
          if (res.status === 401) return { __eva_http_401: true };
          if (res.status === 403) return { __eva_http_403: true };
          if (ct && ct.indexOf("application/json") !== -1) {
            return res.json();
          }
          return res.text();
        } catch (err) {
          return { __eva_error: true, message: String(err && err.message ? err.message : err) };
        }
      };
      const url = `${useApi ? this.apiEmpresasBaseUrl : this.empresasBaseUrl}${apiPath}`;
      const out = await this._eval(evalPost, this.accessToken, url, headers, payload);
      if (out && out.__eva_error) {
        throw new Error("Page evaluate POST failed: " + out.message);
      }
      return out;
    };

    return await this._withReauth(doPost);
  }

  async precargar() {
    const entityIds = [11031, 7176, 7382, 7380, 7381, 26856];
    this._log("precargar: fetching entity details...");
    const entities = [];
    for (const id of entityIds) {
      try {
        const ent = await this.get(`EnterpriseDashBoard/Entity/Detail/${id}/false`, true);
        if (ent && ent.SF && Array.isArray(ent.SF.JPF)) {
          entities.push(ent);
        } else {
          this._log(`Entity ${id} malformed (no JPF array), skipping`);
        }
      } catch (err) {
        this._log(`Entity ${id} failed: ${err && err.message ? err.message : err}`);
      }
    }

    this._log("precargar: fetching candidates for all entities...");
    const candidates = [];
    for (const e of entities) {
      if (!e?.SF?.JPF) continue;
      for (const jpf of e.SF.JPF) {
        try {
          const c = await this.get(
            `EnterpriseDashboardCandidates/Dashboard/${jpf.JPI}`,
            true,
            { idempotencykey: Buffer.from(String(jpf.JPI)).toString("base64") }
          );
          if (c && typeof c === "object" && Array.isArray(c.JPCM)) {
            candidates.push({ ...c, JP: jpf });
          } else {
            this._log(`JPF ${jpf.JPI} malformed or empty, skipping`);
          }
        } catch (err) {
          this._log(`JPF ${jpf.JPI} failed: ${err && err.message ? err.message : err}`);
        }
      }
    }

    let loggedCandidates = 0;
    this.results = candidates
      .filter(Boolean)
      .flatMap((c) =>
        (c.JPCM || []).map((t) => {
          if (loggedCandidates < 3) {
            console.log("EVA RAW CANDIDATE OBJECT (t):\n" + JSON.stringify(t, null, 2));
            console.log("Parent JP (c.JP):\n" + JSON.stringify(c.JP, null, 2));
            loggedCandidates += 1;
          }
          return {
            ...t,
            N: t.N,
            puesto: c.JP?.N ?? "",
            JID: c.JP?.JPI,
          }
        })
      );
    this._log(`precargar: candidates loaded: ${this.results.length}`);

    const cutoff = moment().subtract(this.antiguedad, "months");
    this.cache = this.results
      .filter((r) => moment(r.PD, "YYYY-MM-DD").isAfter(cutoff))
      .reduce((acc, r) => {
        acc[`${r.N} *${r.puesto}*`] = r;
        return acc;
      }, {});
    this._log("precargar done, cache built");
  }

  async downloadPDF(cid) {
    await this.ensurePage();
    if (!this.results || !Array.isArray(this.results) || !this.results.length) {
      throw new Error("Service not ready or candidate cache empty");
    }
    const user = this.results.find((u) => String(u.CID) === String(cid));
    if (!user) throw new Error("CID not found");
    const path = `api/v1/report/${user.JID}/vacant/${user.CID}/candidate/es/language`;
    const base64 = await this.get(path, true);

    // ---- Strict defensive: log and error on anything but valid base64 string ----
    if (typeof base64 !== "string") {
      const errMsg = (
        "EVA: expected base64-encoded PDF string, got " +
        (base64 && typeof base64 === "object" ? JSON.stringify(base64) : String(base64))
      );
      this._log(`[downloadPDF] ${errMsg}`);
      throw new Error(errMsg);
    }
    if (!/^[A-Za-z0-9+/=]+$/.test(base64)) {
      this._log("[downloadPDF] EVA: response not valid base64 string.");
      throw new Error("EVA: response not valid base64 string");
    }
    if (base64.length < 2000) {
      this._log("[downloadPDF] EVA: base64 string too short, probably not a valid PDF.");
      throw new Error("EVA: returned base64 looks invalid/too short");
    }
    try {
      return Buffer.from(base64, "base64");
    } catch (err) {
      this._log(`[downloadPDF] Buffer.from failed: ${err && err.message}`);
      throw new Error("EVA: Buffer.from(base64) failed: " + (err && err.message));
    }
  }
}

module.exports = EvaService;