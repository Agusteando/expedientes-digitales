
const mysql = require("mysql2/promise");
const EvaService = require("../../EvaService.js");

// MySQL pool cache
let pools = {};
function getSigniaPool() {
  if (!pools.signia) {
    pools.signia = mysql.createPool({
      host: "casitaiedis.edu.mx",
      user: "root",
      password: "Nicole10*",
      database: "expedientes_digitales",
      waitForConnections: true,
      connectionLimit: 5,
    });
  }
  return pools.signia;
}
function getPathPool() {
  if (!pools.path) {
    pools.path = mysql.createPool({
      host: "casitaiedis.edu.mx",
      user: "root",
      password: "Nicole10*",
      database: "reclutamiento",
      waitForConnections: true,
      connectionLimit: 5,
    });
  }
  return pools.path;
}

// Only ever one EvaService per process
let _evaInstance = global._evaSingleton;
function getEva() {
  if (!_evaInstance) {
    _evaInstance = new EvaService();
    global._evaSingleton = _evaInstance;
  }
  return _evaInstance;
}

/** Wait for EvaService ready (cached and initialized). */
async function waitEva(eva) {
  eva = eva || getEva();
  return eva.ready
    ? Promise.resolve()
    : new Promise((res) => {
        const t = () => (eva.ready ? res() : setTimeout(t, 400));
        t();
      });
}

module.exports = {
  getSigniaPool,
  getPathPool,
  getEva,
  waitEva,
};
