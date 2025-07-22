
"use client";
import { useState, useEffect, useMemo } from "react";
import { ChevronDownIcon, ChevronUpIcon, UserIcon, CheckCircleIcon, DocumentDuplicateIcon, BookOpenIcon, PencilSquareIcon, ClockIcon } from "@heroicons/react/24/outline";
import Image from "next/image";

function fichaProgress(user) {
  let total = 7;
  let filled = 0;
  if (user.rfc) filled++; if (user.curp) filled++;
  if (user.domicilioFiscal) filled++;
  if (user.fechaIngreso) filled++;
  if (user.puesto) filled++;
  if (user.sueldo !== undefined && user.sueldo !== null && `${user.sueldo}`.length > 0) filled++;
  if (user.horarioLaboral) filled++;
  return { filled, total, pct: Math.round(filled/total*100) };
}
function checklistProgress(user) {
  if (!user.checklistTotal) return { done: 0, total: 0, pct: 0 };
  const done = user.checklistDone || 0;
  return { done, total: user.checklistTotal, pct: Math.round(100 * done / user.checklistTotal) };
}
function signStatusBadge(type, user) {
  const ok = user && user[`firma${type}Ok`];
  return ok
    ? <span className="inline-flex items-center text-xs font-bold rounded bg-emerald-50 border border-emerald-100 px-2 py-1 text-emerald-700"><CheckCircleIcon className="w-4 h-4 mr-1" /> Firmado</span>
    : <span className="inline-flex items-center text-xs font-bold rounded bg-yellow-50 border border-yellow-100 px-2 py-1 text-yellow-700"><ClockIcon className="w-4 h-4 mr-1" /> Incompleto</span>;
}

export default function PlantelAdminMatrix({ planteles, admins }) {
  const [expanded, setExpanded] = useState(null);
  const [data, setData] = useState({});
  const [loading, setLoading] = useState({});
  const [error, setError] = useState({});
  const [allLoaded, setAllLoaded] = useState(false);
  const [search, setSearch] = useState("");

  // Fetch all plantel user progress data on mount!
  useEffect(() => {
    async function fetchAllPlanteles() {
      setAllLoaded(false);
      const promises = planteles.map(async (p) => {
        setLoading(s => ({ ...s, [p.id]: true }));
        setError(e => ({ ...e, [p.id]: "" }));
        try {
          const res = await fetch(`/api/admin/planteles/${p.id}/users/progress`);
          if (!res.ok) throw new Error((await res.text()).slice(0,120));
          const d = await res.json();
          setData(dat => ({ ...dat, [p.id]: d.users }));
        } catch (e) {
          setError(err => ({ ...err, [p.id]: e.message || "Error" }));
        }
        setLoading(s => ({ ...s, [p.id]: false }));
      });
      await Promise.all(promises);
      setAllLoaded(true);
    }
    fetchAllPlanteles();
    // eslint-disable-next-line
  }, [planteles.map(p => p.id).join(",")]);

  function handleExpand(pid) {
    setExpanded(expanded === pid ? null : pid);
  }

  // search input debouncing
  const [searchInput, setSearchInput] = useState("");
  useEffect(() => {
    const handler = setTimeout(() => setSearch(searchInput), 220);
    return () => clearTimeout(handler);
  }, [searchInput]);

  return (
    <section className="mb-8 bg-white border border-cyan-200 shadow-xl rounded-2xl p-4">
      <h2 className="text-xl font-bold flex items-center gap-2 mb-1">
        <UserIcon className="w-6 h-6 text-cyan-600" />
        Progreso de empleados/candidatos por plantel
      </h2>
      <div className="mt-3 mb-2 w-full max-w-xs">
        <input
          aria-label="Buscar persona"
          type="text"
          className="w-full rounded-full px-4 py-2 border border-cyan-200 shadow-sm placeholder-slate-400 text-sm focus:outline-none focus:ring focus:ring-cyan-300"
          placeholder="Buscar empleado por nombre o correo..."
          value={searchInput}
          onChange={e => setSearchInput(e.target.value)}
        />
      </div>
      <div className="flex flex-col gap-4 mt-4">
        {planteles.map((p) => {
          // If a search is active, filter planteles out if none of their users matches search
          let users = data[p.id] || [];
          let hasMatch = true;
          if (search && Array.isArray(users)) {
            hasMatch = users.some(
              u =>
                (u.name && u.name.toLowerCase().includes(search.toLowerCase())) ||
                (u.email && u.email.toLowerCase().includes(search.toLowerCase()))
            );
          }
          if (search && !hasMatch) return null; // hide this plantel
          return (
            <div key={p.id} className="mb-0 border rounded-xl shadow relative bg-gradient-to-br from-cyan-50 via-emerald-50/80 to-fuchsia-50">
              <button
                className="flex flex-row items-center justify-between w-full px-6 py-4 font-bold text-cyan-900 text-base rounded-xl focus:outline-cyan-600"
                onClick={() => handleExpand(p.id)}
                aria-expanded={expanded === p.id}
                aria-controls={`plantel-expand-${p.id}`}
                type="button"
              >
                <span>{p.name}</span>
                <span className="flex items-center gap-2">
                  <PlantelSummaryBar users={users} loading={loading[p.id]} />
                  {expanded === p.id
                    ? <ChevronUpIcon className="w-7 h-7 text-cyan-400" />
                    : <ChevronDownIcon className="w-7 h-7 text-cyan-400" />
                  }
                </span>
              </button>
              <div id={`plantel-expand-${p.id}`}>
                {expanded === p.id && (
                  <div className="p-0 sm:p-2 pt-0 -mt-2">
                    {loading[p.id] && <div className="p-8 text-center text-cyan-700 font-bold">Cargando...</div>}
                    {error[p.id] && <div className="p-4 text-red-700 font-bold">{error[p.id]}</div>}
                    {users && (
                      <PlantelEmployeeProgressTable users={users} search={search} />
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

// Top bar with progress (SaaS style)
function PlantelSummaryBar({ users = [], loading }) {
  const activeUsers = (users || []).filter(u => !!u.isActive);
  if (loading === true || !Array.isArray(users)) {
    return <span className="text-[13px] font-mono text-slate-400 ml-6 animate-pulse">Cargando...</span>;
  }
  const total = activeUsers.length;
  let complete = 0, ready = 0;
  activeUsers.forEach(u => {
    if (u.role === "employee") complete++;
    if (u.readyForApproval) ready++;
  });
  const pct = total === 0 ? 0 : Math.round((complete/total)*100);
  return (
    <span className="flex flex-row gap-1 items-center ml-8">
      <span className="text-xs text-cyan-500 mr-2">{total} usuarios</span>
      <div className="w-24 h-3 rounded-full bg-cyan-100 relative overflow-hidden">
        <div className="absolute left-0 top-0 h-full bg-cyan-400 rounded-l-full transition-all"
          style={{width: `${pct}%`}} />
      </div>
      <span className="ml-2 text-xs text-emerald-700 font-bold">{pct}% completos</span>
      {ready > 0 && <span className="ml-2 text-xs text-fuchsia-700 bg-fuchsia-50 rounded px-2 py-0.5 font-bold border border-fuchsia-100">{ready} listos para aprobar</span>}
    </span>
  );
}

// Main: Table for all users in a plantel (SaaS, mobile first)
function PlantelEmployeeProgressTable({ users, search }) {
  // Filter users per search
  const filteredUsers = useMemo(() => {
    if (!search) return users;
    return users.filter(
      u =>
        (u.name && u.name.toLowerCase().includes(search.toLowerCase())) ||
        (u.email && u.email.toLowerCase().includes(search.toLowerCase()))
    );
  }, [users, search]);

  // Keep matching header and cell widths for sticky columns
  const col1Width = "204px"; // for both <th> and <td> in first col

  return (
    <div className="relative w-full overflow-x-auto overflow-y-visible max-w-full" style={{position: "relative"}}>
      <table className="min-w-full table-auto border text-xs xs:text-sm rounded-lg relative w-full">
        <thead>
          <tr className="bg-cyan-50 border-b border-cyan-100">
            <th
              className="sticky top-0 left-0 z-30 bg-white/95 border-r border-cyan-100 font-bold"
              style={{minWidth:col1Width, maxWidth:col1Width, width:col1Width, boxShadow:"2px 0 2px -1px #e0e7ef"}}
            >Usuario</th>
            <th className="sticky top-0 z-20 bg-white/95 px-2 py-2 font-bold">Rol</th>
            <th className="sticky top-0 z-20 bg-white/95 px-2 py-2 font-bold">Ficha técnica</th>
            <th className="sticky top-0 z-20 bg-white/95 px-2 py-2 font-bold">Expediente</th>
            <th className="sticky top-0 z-20 bg-white/95 px-2 py-2 font-bold">Reglamento</th>
            <th className="sticky top-0 z-20 bg-white/95 px-2 py-2 font-bold">Contrato</th>
            <th className="sticky top-0 z-20 bg-white/95 px-2 py-2 font-bold">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {filteredUsers.length === 0 && (
            <tr>
              <td colSpan={7} className="text-center text-slate-400 py-3 bg-white">Sin usuarios asignados.</td>
            </tr>
          )}
          {filteredUsers.map(u => {
            const fp = fichaProgress(u);
            const cp = checklistProgress(u);
            return (
              <tr key={u.id} className="border-b last:border-b-0 hover:bg-cyan-50 transition">
                <td
                  className="sticky left-0 bg-white z-20 border-r border-cyan-100 flex flex-row gap-2 items-center px-2 py-2"
                  style={{
                    minWidth: col1Width,
                    maxWidth: col1Width,
                    width: col1Width,
                    boxShadow: "2px 0 2px -1px #e0e7ef",
                  }}
                >
                  <Image src={u.picture || "/IMAGOTIPO-IECS-IEDIS.png"} width={32} height={32} alt="" className="rounded-full bg-white border border-cyan-100" />
                  <div className="min-w-0 w-full">
                    <div className="font-semibold text-cyan-900 truncate">{u.name}</div>
                    <div className="text-[11px] text-slate-400 truncate">{u.email}</div>
                  </div>
                </td>
                <td className="text-center px-2 py-2">
                  <span className={`inline-block px-2 py-0.5 rounded-full font-bold text-xs ${
                    u.role === "employee"
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-cyan-100 text-cyan-700"
                  }`}>{u.role === "employee" ? "Empleado" : "Candidato"}</span>
                </td>
                <td className="px-2 py-2 min-w-[120px]">
                  <small>{fp.filled} / {fp.total}</small>
                  <div className="w-20 h-2 bg-cyan-100 rounded-full overflow-hidden mt-1">
                    <div
                      className={fp.pct > 95 ? "bg-emerald-400" : fp.pct > 60 ? "bg-cyan-400" : "bg-yellow-400"}
                      style={{width: `${fp.pct}%`, height: "100%"}}
                    ></div>
                  </div>
                </td>
                <td className="px-2 py-2 min-w-[120px]">
                  <small>{cp.done} / {cp.total}</small>
                  <div className="w-20 h-2 bg-emerald-100 rounded-full overflow-hidden mt-1">
                    <div
                      className={cp.pct > 95 ? "bg-emerald-700" : cp.pct > 60 ? "bg-emerald-400" : "bg-yellow-400"}
                      style={{width: `${cp.pct}%`, height: "100%"}}
                    ></div>
                  </div>
                </td>
                <td className="px-2 py-2">
                  <BadgeFirma status={u.firmaReglamentoOk} type="reglamento" />
                </td>
                <td className="px-2 py-2">
                  <BadgeFirma status={u.firmaContratoOk} type="contrato" />
                </td>
                <td className="px-2 py-2 flex gap-1 flex-row">
                  <a href="#" className="flex items-center gap-1 text-fuchsia-700 hover:underline font-bold" title="Ficha técnica">
                    <DocumentDuplicateIcon className="w-5 h-5" /></a>
                  <a href="#" className="flex items-center gap-1 text-cyan-700 hover:underline font-bold" title="Expediente">
                    <BookOpenIcon className="w-5 h-5" /></a>
                  {u.readyForApproval && u.role === "candidate" && (
                    <button className="inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-600 text-white font-bold text-xs gap-1" title="Aprobar">
                      <CheckCircleIcon className="w-4 h-4" />Aprobar
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function BadgeFirma({ status, type }) {
  let icon = type === "reglamento" ? <BookOpenIcon className="w-4 h-4 mr-1" /> : <PencilSquareIcon className="w-4 h-4 mr-1" />;
  if (status)
    return <span className="inline-flex items-center text-xs font-bold rounded bg-emerald-50 border border-emerald-100 px-2 py-1 text-emerald-700">{icon} Firmado</span>;
  return <span className="inline-flex items-center text-xs font-bold rounded bg-yellow-50 border border-yellow-100 px-2 py-1 text-yellow-700">{icon} Falta firmar</span>;
}
