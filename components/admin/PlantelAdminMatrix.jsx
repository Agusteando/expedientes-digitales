
"use client";
import { useState, useEffect, useMemo } from "react";
import { ChevronDownIcon, ChevronUpIcon, UserIcon, CheckCircleIcon, ClockIcon, DocumentDuplicateIcon, BookOpenIcon, PencilSquareIcon } from "@heroicons/react/24/outline";
import Image from "next/image";

export default function PlantelAdminMatrix({ planteles, admins }) {
  const [expanded, setExpanded] = useState(null);
  const [data, setData] = useState({});
  const [loading, setLoading] = useState({});
  const [error, setError] = useState({});
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function fetchAllPlanteles() {
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
    }
    fetchAllPlanteles();
    // eslint-disable-next-line
  }, [planteles.map(p => p.id).join(",")]);

  function handleExpand(pid) {
    setExpanded(expanded === pid ? null : pid);
  }

  const [searchInput, setSearchInput] = useState("");
  useEffect(() => {
    const handler = setTimeout(() => setSearch(searchInput), 220);
    return () => clearTimeout(handler);
  }, [searchInput]);

  return (
    <section className="mb-8 bg-white border border-cyan-200 shadow-xl rounded-2xl p-4">
      <h2 className="text-xl font-bold flex items-center gap-2 mb-1">
        <UserIcon className="w-6 h-6 text-cyan-600" />
        Progreso expediente laboral por plantel
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
          let users = data[p.id] || [];
          let hasMatch = true;
          if (search && Array.isArray(users)) {
            hasMatch = users.some(
              u =>
                (u.name && u.name.toLowerCase().includes(search.toLowerCase())) ||
                (u.email && u.email.toLowerCase().includes(search.toLowerCase()))
            );
          }
          if (search && !hasMatch) return null;
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
                    {users && <PlantelEmployeeProgressTable users={users} search={search} />}
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

// Top bar: summarize user progress + admin completion separately
function PlantelSummaryBar({ users = [], loading }) {
  if (loading === true || !Array.isArray(users)) {
    return <span className="text-[13px] font-mono text-slate-400 ml-6 animate-pulse">Cargando...</span>;
  }
  const userTotal = users.length;
  const userDoneCount = users.filter(u => u.userProgress.complete).length;
  const adminDoneCount = users.filter(u => u.fullyCompleted).length;

  return (
    <span className="flex flex-row gap-2 items-center ml-6">
      <span className="text-xs text-cyan-500 mr-1">{userTotal} usuarios</span>
      <div className="w-24 h-3 rounded-full bg-cyan-100 relative overflow-hidden">
        <div className="absolute left-0 top-0 h-full bg-cyan-400 rounded-l-full transition-all"
          style={{width: `${userTotal ? Math.round((userDoneCount/userTotal)*100) : 0}%`}} />
      </div>
      <span className="ml-2 text-xs text-cyan-700 font-bold">{userDoneCount}/{userTotal} con docs completos</span>
      <span className="ml-2 text-xs text-emerald-800 font-bold">{adminDoneCount}/{userTotal} expediente completo</span>
    </span>
  );
}

function PlantelEmployeeProgressTable({ users, search }) {
  const filteredUsers = useMemo(() => {
    if (!search) return users;
    return users.filter(
      u =>
        (u.name && u.name.toLowerCase().includes(search.toLowerCase())) ||
        (u.email && u.email.toLowerCase().includes(search.toLowerCase()))
    );
  }, [users, search]);
  const col1Width = "208px";
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
            <th className="sticky top-0 z-20 bg-white/95 px-2 py-2 font-bold">Docs usuario</th>
            <th className="sticky top-0 z-20 bg-white/95 px-2 py-2 font-bold">Proyectivos<br/>(admin)</th>
            <th className="sticky top-0 z-20 bg-white/95 px-2 py-2 font-bold">Completo</th>
          </tr>
        </thead>
        <tbody>
          {filteredUsers.length === 0 && (
            <tr>
              <td colSpan={7} className="text-center text-slate-400 py-3 bg-white">Sin usuarios asignados.</td>
            </tr>
          )}
          {filteredUsers.map(u => (
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
                <small>{u.userProgress.done} / {u.userProgress.total}</small>
                <div className="w-20 h-2 bg-cyan-100 rounded-full overflow-hidden mt-1">
                  <div className={u.userProgress.pct === 100 ? "bg-emerald-400" : "bg-cyan-400"}
                    style={{width: `${u.userProgress.pct}%`, height: "100%"}} />
                </div>
              </td>
              <td className="px-2 py-2 min-w-[60px] text-center">
                {u.adminProgress.proyectivosUploaded
                  ? <span className="inline-flex items-center text-xs font-bold rounded bg-emerald-50 border border-emerald-100 px-2 py-1 text-emerald-700">Sí</span>
                  : <span className="inline-flex items-center text-xs font-bold rounded bg-yellow-50 border border-yellow-100 px-2 py-1 text-yellow-700">Falta</span>
                }
              </td>
              <td className="px-2 py-2 min-w-[60px] text-center">
                {u.fullyCompleted
                  ? <span className="inline-flex items-center text-xs font-bold rounded bg-emerald-100 border border-emerald-200 px-2 py-1 text-emerald-800">Listo</span>
                  : <span className="inline-flex items-center text-xs font-bold rounded bg-slate-100 border border-slate-200 px-2 py-1 text-slate-500">En proceso</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
