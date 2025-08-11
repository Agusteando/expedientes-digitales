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
        const dataObj = await this.page.evaluate(() => {
          try { return JSON.parse(localStorage.getItem("authorization") || "{}"); }
          catch (_) { return {}; }
        });
        if (!dataObj.access_token) throw new Error("No access token in localStorage");
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
    return this.page.evaluate(
      async (token, url, extraHeaders) => {
        const headers = {
          accept: "application/json,text/plain,*/*",
          authorization: `Bearer ${token}`,
          "content-type": "application/json",
          ...extraHeaders
        };
        const res = await fetch(url, { method: "GET", headers });
        return res.json();
      },
      this.accessToken,
      url,
      headers
    );
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
