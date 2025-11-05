import React, { useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import initialSlots from "./batches.json";

// --- Utility helpers ---
const fmtTime = (t) => t; // already human-friendly in dataset
const classNames = (...a) => a.filter(Boolean).join(" ");

// Discount tiers: 2nd = 1000, 3rd = 2500, 4th = 5000
const discountForCount = (n) => {
  if (n >= 4) return 5000;
  if (n === 3) return 2500;
  if (n === 2) return 1000;
  return 0;
};

// Simple grouper
const groupBy = (arr, keyFn) =>
  arr.reduce((acc, item) => {
    const k = keyFn(item);
    (acc[k] ||= []).push(item);
    return acc;
  }, {});

// Slots now live in src/batches.json for easy edits.

function DayTabs({ day, onDay }) {
  const days = [
    { id: 1, label: "Mon" },
    { id: 2, label: "Tue" },
    { id: 3, label: "Wed" },
    { id: 4, label: "Thu" },
    { id: 5, label: "Fri" },
    { id: 6, label: "Sat" },
    { id: 7, label: "Sun" },
  ];
  return (
    <div className="grid grid-cols-7 gap-1 rounded-xl bg-gray-100 p-1">
      {days.map((d) => (
        <button
          key={d.id}
          onClick={() => onDay(d.id)}
          className={classNames(
            "py-2 rounded-lg text-xs font-semibold",
            day === d.id ? "bg-white shadow-sm" : "text-gray-500"
          )}
        >
          {d.label}
        </button>
      ))}
    </div>
  );
}

function MultiTimeTabs({ times, onToggle }) {
  const options = [
    { id: "morning", label: "10–12" },
    { id: "midday", label: "12–2" },
    { id: "afternoon", label: "3–5" },
    { id: "evening", label: "5–7" },
  ];
  return (
    <div className="flex gap-2">
      {options.map((o) => (
        <button
          key={o.id}
          onClick={() => onToggle(o.id)}
          className={classNames("px-2.5 py-1.5 rounded-lg text-xs font-medium", times.includes(o.id) ? "bg-black text-white" : "bg-gray-100 text-gray-800")}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function NudgeBanner({ count }) {
  const cfg = count >= 4 ? null : (count < 2 ? { more: 2 - count, save: 1000 } : count === 2 ? { more: 1, save: 2500 } : { more: 1, save: 5000 });
  return (
    <AnimatePresence>
      {cfg && (
        <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className="px-4 mt-2">
          <div className="rounded-xl bg-amber-50 ring-1 ring-amber-200 p-2 text-[12px]">
            Add <span className="font-semibold">{cfg.more}</span> more to save <span className="font-semibold">{cfg.save.toLocaleString()}</span> coins this week.
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Minimal monochrome subject button (one-line, subject only)
function SubjectButton({ slot, selected, onToggle }) {
  const isDisabled = slot.status === "closed" || slot.seatsLeft === 0;
  return (
    <button
      disabled={isDisabled}
      onClick={() => onToggle(slot)}
      className={classNames(
        "px-3 py-1.5 rounded-md border text-sm leading-none transition",
        selected ? "bg-black text-white border-black" : "bg-white text-gray-900 border-gray-200 hover:bg-gray-50",
        isDisabled && "opacity-50 cursor-not-allowed"
      )}
      aria-pressed={selected}
    >
      <span className="align-middle">{slot.subject}</span>
      {selected && <span className="ml-1 align-middle">✓</span>}
    </button>
  );
}

// Time divider label with subtle rule to reduce redundancy
function TimeDivider({ label }) {
  return (
    <div className="flex items-center gap-2 text-[11px] text-gray-600 select-none">
      <span className="font-semibold">{label}</span>
      <div className="h-px bg-gray-200 flex-1" />
    </div>
  );
}

export default function App() {
  const [selected, setSelected] = useState([]);
  const [activeSubject, setActiveSubject] = useState("all");
  const [activeTimes, setActiveTimes] = useState(["morning", "midday", "afternoon", "evening"]);
  const [activeDay, setActiveDay] = useState(1); // Mon
  const [slots, setSlots] = useState(initialSlots);
  const sectionRefs = useRef({});

  const filtered = useMemo(() => {
    return slots
      .filter((s) => {
        const byTime =
          (activeTimes.includes("morning") && s.time.includes("10:00")) ||
          (activeTimes.includes("midday") && s.time.includes("12:00")) ||
          (activeTimes.includes("afternoon") && s.time.includes("3:00")) ||
          (activeTimes.includes("evening") && s.time.includes("5:00"));
        const bySubject = activeSubject === "all" ? true : s.subject === activeSubject;
        return byTime && bySubject;
      })
      .sort((a, b) => a.dow - b.dow);
  }, [slots, activeSubject, activeTimes]);

  const toggle = (slot) => {
    setSelected((prev) => {
      const exists = prev.find((x) => x.id === slot.id);
      return exists ? prev.filter((x) => x.id !== slot.id) : [...prev, slot];
    });
  };

  const coins = selected.reduce((s, x) => s + x.coins, 0);
  const discount = discountForCount(selected.length);
  const nextTarget =
    selected.length < 2
      ? { more: 2 - selected.length, save: 1000 }
      : selected.length === 2
      ? { more: 1, save: 2500 }
      : selected.length === 3
      ? { more: 1, save: 5000 }
      : null;

  return (
    <div className="mx-auto max-w-md min-h-[100dvh] bg-white">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b">
        <div className="px-4 py-3 flex items-center gap-3">
          <div className="size-9 rounded-xl bg-black text-white grid place-items-center font-bold">oh</div>
          <div>
            <div className="text-sm text-gray-500 leading-tight">Openhouse Afterschool</div>
            <div className="text-base font-bold">Build your weekly plan</div>
          </div>
          <div className="ml-auto text-xs text-gray-600">Recurring weekly</div>
        </div>
        <div className="px-4 pb-3 flex items-center justify-between gap-3">
          <DayTabs
            day={activeDay}
            onDay={(id) => {
              setActiveDay(id);
              const el = sectionRefs.current[id];
              if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
            }}
          />
        </div>
      </div>

      {/* Filters */}
      <div className="px-4 pt-4">
        <div className="flex items-center justify-between">
          <MultiTimeTabs
            times={activeTimes}
            onToggle={(id) =>
              setActiveTimes((t) => (t.includes(id) ? t.filter((x) => x !== id) : [...t, id]))
            }
          />
          <div className="flex items-center gap-2">
            <button
              onClick={() =>
                setSlots((s) =>
                  s.concat({
                    id: `sample-${Date.now()}`,
                    dow: 2,
                    day: "Tue",
                    dateLabel: "",
                    time: "5:00–7:00 PM",
                    subject: "Art & Design",
                    level: "beginner",
                    coins: 3000,
                    seatsLeft: 6,
                    status: "open",
                    teacher: "TBD",
                    center: "HRBR",
                  })
                )
              }
              className="text-xs px-2 py-1 rounded-lg bg-gray-900 text-white"
            >
              Add Batch (demo)
            </button>
            <div className="text-xs text-gray-500">
              Center: <span className="font-semibold">HRBR</span>
            </div>
          </div>
        </div>
      </div>

      {/* Week overview (sticky once a schedule exists) */}
      <div className={classNames("px-4 mt-3", selected.length > 0 && "sticky top-[92px] z-30 bg-white/90 backdrop-blur")}> 
        <div className="text-[11px] font-semibold text-gray-500 mb-2 uppercase tracking-wide">Your week overview</div>
        <div className="rounded-xl border border-dashed p-2">
          <div className="grid grid-cols-7 text-[10px] text-gray-500 mb-1">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
              <div className="text-center" key={d}>
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1.5">
            {[1, 2, 3, 4, 5, 6, 7].map((d) => (
              <div key={d} className="min-h-20 rounded-md bg-gray-50 p-1">
                {selected
                  .filter((s) => s.dow === d)
                  .map((s) => (
                    <div key={s.id} className="mb-1 rounded bg-gray-900 text-white px-1 py-0.5">
                      <div className="text-[10px] font-medium truncate">{s.subject}</div>
                      <div className="text-[9px] opacity-80 truncate">{s.time}</div>
                    </div>
                  ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Discount nudge */}
      <NudgeBanner count={selected.length} />

      {/* Slots list grouped by day and time (clean, monochrome) */}
      <div className="px-4 mt-3 pb-28 space-y-5">
        {[1, 2, 3, 4, 5, 6, 7].map((d) => {
          const daySlots = filtered.filter((s) => s.dow === d);
          if (daySlots.length === 0) return null;
          const label = ["", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][d];
          const groups = groupBy(daySlots, (s) => s.time);
          const ordered = Object.keys(groups).sort((a, b) => a.localeCompare(b));
          return (
            <section key={d} ref={(el) => (sectionRefs.current[d] = el)}>
              <div className="text-[12px] font-semibold text-gray-500 mb-1 uppercase tracking-wide">{label}</div>
              <div className="space-y-2">
                {ordered.map((time) => (
                  <div key={time}>
                    <TimeDivider label={time} />
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      {groups[time].map((slot) => (
                        <SubjectButton
                          key={slot.id}
                          slot={slot}
                          selected={!!selected.find((s) => s.id === slot.id)}
                          onToggle={toggle}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          );
        })}
        {filtered.length === 0 && (
          <div className="text-sm text-gray-500 text-center py-10">No sessions for this selection.</div>
        )}
      </div>

      {/* Bottom bar with discount */}
      {selected.length > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-50">
          <div className="mx-auto max-w-md">
            <div className="m-3 rounded-2xl bg-white shadow-lg ring-1 ring-gray-200 p-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-gray-500">Weekly plan</div>
                  <div className="text-sm font-semibold">
                    {selected.length} selection{selected.length === 1 ? "" : "s"} · {coins.toLocaleString()} coins
                  </div>
                  <AnimatePresence>
                    {discount > 0 && (
                      <motion.div
                        key={discount}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        className="text-xs mt-1 text-emerald-700"
                      >
                        Savings applied: −{discount.toLocaleString()} coins
                      </motion.div>
                    )}
                  </AnimatePresence>
                  {nextTarget && (
                    <div className="text-[11px] mt-1 text-gray-600">
                      Add <span className="font-semibold">{nextTarget.more}</span> more to save{" "}
                      <span className="font-semibold">{nextTarget.save.toLocaleString()}</span>
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-500">Due / week</div>
                  <div className="text-base font-bold">{Math.max(0, coins - discount).toLocaleString()}</div>
                </div>
              </div>
              <button className="mt-2 w-full px-4 py-2 rounded-xl bg-black text-white text-sm font-semibold">
                Review & Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
