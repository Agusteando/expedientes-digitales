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

  // === SAFE evaluate helper ===
  async _eval(fn, ...args) {
    // Log a short, stable preview of the function source as it will be serialized
    try {
      const src = `(${fn.toString()})`;
      const preview = src.length > 420 ? `${src.slice(0, 420)}…` : src;
      this._log(`evaluate: ${preview}`);
    } catch (_) {
      this._log("evaluate: <unable to preview function source>");
    }

    // Log argument shapes with token masking
    const maskedArgs = args.map((a) => {
      if (typeof a === "string") {
        // Mask secrets/tokens
        if (a.length > 20) return `${a.slice(0, 6)}…${a.slice(-4)}`;
        return a;
      }
      if (a && typeof a === "object") {
        // Don’t dump large objects; show top-level keys
        try { return { _keys: Object.keys(a).slice(0, 12) }; } catch { return { _type: "object" }; }
      }
      return a;
    });
    this._log(`evaluate args: ${JSON.stringify(maskedArgs)}`);

    // Execute in the page context
    return this.page.evaluate(fn, ...args);
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
    this._log("Puppeteer browser launched, creating newPage...");
    this.page = await this.browser.newPage();
    await this.page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0 Safari/537.36"
    );
    this.page.setDefaultTimeout(45000);
    this._log("Puppeteer page ready. Next: login...");
  }

  async login() {
    this._log("Navigating to Evaluatest login page...");
    await this.page.goto(this.empresasBaseUrl, {
      waitUntil: ["domcontentloaded", "load"],
      timeout: 0,
    });
    await this.page.type('input[name="Email"]', this.email);
    await this.page.type('input[name="Password"]', this.password);

    await this.page.waitForSelector('button[type="submit"]');
    await this.page.keyboard.press("Enter");

    try {
      this._log("Waiting for /api/authorization response...");
      const response = await this.page.waitForResponse(
        (resp) => resp.url().includes("/api/authorization"),
        { timeout: 5000 }
      );
      const dataObj = await response.json();
      if (!dataObj.access_token) throw new Error("No access token in response");
      this.accessToken  = dataObj.access_token;
      this.refreshToken = dataObj.refresh_token;
      this._log("Got accessToken (network)");
      return this.accessToken;
    } catch (e) {
      this._log("Network login failed, trying localStorage...");
      try {
        // Standalone, closure-free function for evaluate
        const readAuthFromLocalStorage = function () {
          try {
            var raw = (window && window.localStorage ? window.localStorage.getItem("authorization") : null) || "{}";
            // Return only the parsed object to keep the external API identical
            return JSON.parse(raw);
          } catch (err) {
            return {};
          }
        };

        const dataObj = await this._eval(readAuthFromLocalStorage);
        if (!dataObj || !dataObj.access_token) throw new Error("No access token in localStorage");
        this.accessToken  = dataObj.access_token;
        this.refreshToken = dataObj.refresh_token;
        this._log("Got accessToken from localStorage");
        return this.accessToken;
      } catch (err) {
        this._log("Failed to get access token after login (network and localStorage both failed)");
        throw new Error("Failed to get access token after login (network and localStorage both failed)");
      }
    }
  }

  async get(apiPath, useApi = false, headers = {}) {
    const url = `${useApi ? this.apiEmpresasBaseUrl : this.empresasBaseUrl}${apiPath}`;
    this._log("GET " + url);

    // Fully self-contained function for page context
    const evalGetJson = async function (token, targetUrl, extraHeaders) {
      try {
        // Build headers entirely inside the page context
        var base = {
          accept: "application/json,text/plain,*/*",
          authorization: "Bearer " + String(token || ""),
          "content-type": "application/json"
        };
        var merged = {};
        // Manual merge to avoid spread operators being altered by transformers
        var k;
        for (k in base) { if (Object.prototype.hasOwnProperty.call(base, k)) { merged[k] = base[k]; } }
        if (extraHeaders && typeof extraHeaders === "object") {
          for (k in extraHeaders) { if (Object.prototype.hasOwnProperty.call(extraHeaders, k)) { merged[k] = extraHeaders[k]; } }
        }

        // Always use window.fetch explicitly
        var res = await window.fetch(String(targetUrl), { method: "GET", headers: merged });

        // Prefer JSON, fall back to text (some endpoints may respond differently on errors)
        var ct = (res && res.headers && res.headers.get) ? res.headers.get("content-type") : null;
        if (ct && ct.indexOf("application/json") !== -1) {
          return res.json();
        }
        return res.text();
      } catch (err) {
        // Surface a structured error back to Node
        return { __eva_error: true, message: String(err && err.message ? err.message : err) };
      }
    };

    const out = await this._eval(
      evalGetJson,
      this.accessToken,
      url,
      headers
    );

    if (out && out.__eva_error) {
      throw new Error("Page evaluate GET failed: " + out.message);
    }
    return out;
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
    const user = this.results.find((u) => String(u.CID) === String(cid));
    if (!user) throw new Error("CID not found");
    const path = `api/v1/report/${user.JID}/vacant/${user.CID}/candidate/es/language`;
    const base64 = await this.get(path, true);
    return Buffer.from(base64, "base64");
  }
}

module.exports = EvaService;