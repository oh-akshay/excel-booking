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

function NudgeBanner({ count, offset = false }) {
  const cfg = count >= 4 ? null : (count < 2 ? { more: 2 - count, save: 1000 } : count === 2 ? { more: 1, save: 2500 } : { more: 1, save: 5000 });
  return (
    <AnimatePresence>
      {cfg && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16 }}
          className={classNames(
            "fixed inset-x-0 z-40",
            offset ? "bottom-28" : "bottom-4"
          )}
        >
          <div className="mx-auto max-w-md px-4">
            <div className="rounded-full bg-amber-50 ring-1 ring-amber-200 px-3 py-2 text-[12px] text-center shadow-sm">
              Add <span className="font-semibold">{cfg.more}</span> more to save <span className="font-semibold">₹{cfg.save.toLocaleString()}</span> / month
            </div>
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
  const [activeTimes, setActiveTimes] = useState(["morning", "midday", "afternoon", "evening"]);
  const [activeDay, setActiveDay] = useState(1); // Mon
  const [slots, setSlots] = useState(initialSlots);
  const [stage, setStage] = useState("intro"); // intro | planner | checkout
  const sectionRefs = useRef({});
  const allSubjects = useMemo(() => Array.from(new Set(slots.map((s) => s.subject))).sort(), [slots]);
  const [activeSubjects, setActiveSubjects] = useState(allSubjects);
  const subjectPrices = useMemo(() => {
    const out = {};
    for (const s of slots) if (out[s.subject] == null) out[s.subject] = s.coins;
    return out;
  }, [slots]);
  const sortedSelected = useMemo(
    () =>
      [...selected].sort((a, b) =>
        a.dow !== b.dow
          ? a.dow - b.dow
          : a.time.localeCompare(b.time) || a.subject.localeCompare(b.subject)
      ),
    [selected]
  );

  const filtered = useMemo(() => {
    return slots
      .filter((s) => {
        const byTime =
          (activeTimes.includes("morning") && s.time.includes("10:00")) ||
          (activeTimes.includes("midday") && s.time.includes("12:00")) ||
          (activeTimes.includes("afternoon") && s.time.includes("3:00")) ||
          (activeTimes.includes("evening") && s.time.includes("5:00"));
        const bySubject = activeSubjects.length === 0 ? true : activeSubjects.includes(s.subject);
        return byTime && bySubject;
      })
      .sort((a, b) => a.dow - b.dow);
  }, [slots, activeSubjects, activeTimes]);

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

  // Intro page: pricing and discounts before planning
  if (stage === "intro") {
    return (
      <div className="mx-auto max-w-md min-h-[100dvh] bg-white">
        <div className="sticky top-0 z-40 bg-white/90 backdrop-blur">
          <div className="px-4 py-3 flex items-center gap-3">
            <div className="size-9 rounded-xl bg-black text-white grid place-items-center font-bold">oh</div>
            <div>
              <div className="text-sm text-gray-500 leading-tight">Openhouse Afterschool</div>
              <div className="text-base font-bold">Pricing & Savings</div>
            </div>
            <div className="ml-auto text-xs text-gray-600">Center: HRBR</div>
          </div>
        </div>

        <div className="px-4 py-4">
          {/* Friendly hero */}
          <div className="mt-1">
            <div className="text-2xl font-bold tracking-tight">Let’s build your weekly plan</div>
            <div className="text-sm text-gray-600 mt-1">Billed monthly. Save more as you add classes.</div>
          </div>

          {/* Soft chips for savings */}
          <div className="mt-4">
            <div className="text-sm font-semibold">Monthly savings</div>
            <div className="mt-2 flex flex-wrap gap-2">
              <span className="px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 text-sm font-medium">2 classes · save ₹1,000 / month</span>
              <span className="px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 text-sm font-medium">3 classes · save ₹2,500 / month</span>
              <span className="px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 text-sm font-medium">4+ classes · save ₹5,000 / month</span>
            </div>
            <div className="mt-2 text-xs text-gray-600">Mix and match — same subject twice or different subjects both count toward savings. Applied automatically while you plan.</div>
          </div>

          {/* Simple price list (no boxes) */}
          <div className="mt-6">
            <div className="text-sm font-semibold">Per month prices</div>
            <div className="mt-1 divide-y divide-gray-200">
              {Object.keys(subjectPrices).map((k) => (
                <div key={k} className="py-2 flex items-center justify-between text-sm">
                  <div>{k}</div>
                  <div className="font-semibold">₹{subjectPrices[k].toLocaleString()} / month</div>
                </div>
              ))}
            </div>
          </div>

          {/* Gentle next steps */}
          <div className="mt-6">
            <div className="text-sm font-semibold mb-1">What happens next</div>
            <div className="space-y-1 text-sm text-gray-700">
              <div>• Pick classes for the week.</div>
              <div>• Watch your monthly savings grow.</div>
              <div>• Review and confirm — you can change anytime.</div>
            </div>
            <button
              className="mt-4 w-full px-4 py-2.5 rounded-xl bg-black text-white text-sm font-semibold active:scale-[0.99]"
              onClick={() => setStage("planner")}
            >
              Start planning
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Checkout page: summary and savings (cart)
  if (stage === "checkout") {
    const labelForDow = ["", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const subtotal = coins;
    const savings = discount;
    const due = Math.max(0, subtotal - savings);
    return (
      <div className="mx-auto max-w-md min-h-[100dvh] bg-white">
        <div className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b">
          <div className="px-4 py-3 flex items-center gap-3">
            <button
              onClick={() => setStage("planner")}
              className="text-sm text-gray-600 hover:text-black"
            >
              ← Back
            </button>
            <div className="size-8 rounded-lg bg-black text-white grid place-items-center font-bold ml-1">oh</div>
            <div className="font-bold text-base">Review & Confirm</div>
            <div className="ml-auto text-xs text-gray-600">Billed monthly</div>
          </div>
        </div>

        <div className="px-4 py-4">
          <div className="text-sm text-gray-600 mb-2">Your selections</div>
          <div className="divide-y divide-gray-200 rounded-lg ring-1 ring-gray-200 overflow-hidden bg-white">
            {sortedSelected.map((s) => (
              <div key={s.id} className="px-3 py-2 flex items-center gap-2">
                <div className="text-xs text-gray-500 w-10">{labelForDow[s.dow]}</div>
                <div className="text-xs text-gray-500 w-20">{s.time.replace(" PM", "").replace(" AM", "")}</div>
                <div className="text-sm font-medium flex-1">{s.subject}</div>
                <div className="text-sm font-semibold">₹{s.coins.toLocaleString()}</div>
              </div>
            ))}
          </div>

          <div className="mt-4 rounded-xl bg-gray-50 ring-1 ring-gray-200 p-3">
            <div className="flex items-center justify-between text-sm">
              <div className="text-gray-600">Subtotal / month</div>
              <div className="font-semibold">₹{subtotal.toLocaleString()}</div>
            </div>
            <div className="flex items-center justify-between text-sm mt-1">
              <div className="text-gray-600">Savings</div>
              <div className="font-semibold text-emerald-700">Save ₹{savings.toLocaleString()} / month</div>
            </div>
            <div className="h-px bg-gray-200 my-2" />
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">Due / month</div>
              <div className="text-base font-bold">₹{due.toLocaleString()}</div>
            </div>
            <div className="mt-1 text-[10px] text-gray-500">
              Same subject twice or different subjects — both count toward savings. Selections repeat weekly.
            </div>
          </div>

          <button className="mt-4 w-full px-4 py-2.5 rounded-xl bg-black text-white text-sm font-semibold active:scale-[0.99]">
            Confirm enrollment
          </button>
        </div>
      </div>
    );
  }

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

      {/* Filters: Subject multiselect */}
      <div className="px-4 pt-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex flex-wrap gap-1.5">
            <button
              className={classNames(
                "px-2.5 py-1.5 rounded-lg text-xs font-medium",
                activeSubjects.length === allSubjects.length ? "bg-black text-white" : "bg-gray-100 text-gray-800"
              )}
              onClick={() => setActiveSubjects(allSubjects)}
            >
              All
            </button>
            {allSubjects.map((subj) => {
              const on = activeSubjects.includes(subj);
              return (
                <button
                  key={subj}
                  onClick={() =>
                    setActiveSubjects((prev) => (prev.includes(subj) ? prev.filter((s) => s !== subj) : [...prev, subj]))
                  }
                  className={classNames(
                    "px-2.5 py-1.5 rounded-lg text-xs font-medium",
                    on ? "bg-black text-white" : "bg-gray-100 text-gray-800"
                  )}
                >
                  {subj}
                </button>
              );
            })}
          </div>
          <div className="text-xs text-gray-500">
            Center: <span className="font-semibold">HRBR</span>
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

      {/* Discount nudge (bottom pop) */}
      <NudgeBanner count={selected.length} offset={selected.length > 0} />

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
                    {selected.length} selection{selected.length === 1 ? "" : "s"} · ₹{coins.toLocaleString()} / month
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
                        You save ₹{discount.toLocaleString()} / month
                      </motion.div>
                    )}
                  </AnimatePresence>
                  {nextTarget && (
                    <div className="text-[11px] mt-1 text-gray-600">
                      Add <span className="font-semibold">{nextTarget.more}</span> more to save <span className="font-semibold">₹{nextTarget.save.toLocaleString()}</span> / month
                    </div>
                  )}
                  <div className="text-[10px] mt-1 text-gray-500">
                    Same subject twice or different subjects — both count toward savings.
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-500">Due / month</div>
                  <div className="text-base font-bold">₹{Math.max(0, coins - discount).toLocaleString()}</div>
                </div>
              </div>
              <button
                className="mt-2 w-full px-4 py-2 rounded-xl bg-black text-white text-sm font-semibold"
                onClick={() => setStage("checkout")}
              >
                Review & Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
