import { useMemo, useState, type CSSProperties } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, Clock, Trash2 } from "lucide-react";
import { nanoid } from "nanoid";
import { useApp, type MonthEvent } from "@/contexts/AppContext";
import { formatDateToDateString, isSameDay } from "@/lib/dateUtils";
import AdvancedColorPicker from "@/components/AdvancedColorPicker";
import FormModal from "@/components/FormModal";
import { FormInput } from "@/components/FormInputs";

const WEEKDAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

function parseDate(dateString: string) {
  const [year, month, day] = dateString.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function addDays(date: Date, amount: number) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + amount);
}

function getEventEndDate(event: MonthEvent) {
  return formatDateToDateString(addDays(parseDate(event.startDate), Math.max(1, event.duration) - 1));
}

function coversDate(event: MonthEvent, dateString: string) {
  return event.startDate <= dateString && getEventEndDate(event) >= dateString;
}

function getCalendarDays(month: Date) {
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const mondayOffset = (first.getDay() + 6) % 7;
  const gridStart = addDays(first, -mondayOffset);
  return Array.from({ length: 42 }, (_, index) => addDays(gridStart, index));
}

function getReadableDate(dateString: string) {
  return parseDate(dateString).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" });
}

export default function MonthCalendar({ onSelectDate }: { onSelectDate?: (date: Date) => void }) {
  const { monthEvents: events, saveMonthEvent, deleteMonthEvent } = useApp();
  const today = useMemo(() => new Date(), []);
  const [visibleMonth, setVisibleMonth] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [eventDate, setEventDate] = useState(formatDateToDateString(today));
  const [eventTitle, setEventTitle] = useState("");
  const [eventColor, setEventColor] = useState("#315cff");
  const [eventDuration, setEventDuration] = useState("1");
  const [eventTime, setEventTime] = useState("");

  const calendarDays = useMemo(() => getCalendarDays(visibleMonth), [visibleMonth]);

  const resetEditor = () => {
    setEditingEventId(null);
    setEventTitle("");
    setEventColor("#315cff");
    setEventDuration("1");
    setEventTime("");
  };

  const closeEditor = () => {
    setIsEditorOpen(false);
    resetEditor();
  };

  const openDay = (date: Date) => {
    const dateString = formatDateToDateString(date);
    const existingEvent = events.find((event) => coversDate(event, dateString));
    onSelectDate?.(date);

    if (existingEvent) {
      setEditingEventId(existingEvent.id);
      setEventDate(existingEvent.startDate);
      setEventTitle(existingEvent.title);
      setEventColor(existingEvent.color);
      setEventDuration(String(existingEvent.duration));
      setEventTime(existingEvent.time || "");
    } else {
      resetEditor();
      setEventDate(dateString);
    }

    setIsEditorOpen(true);
  };

  const saveEvent = (event: React.FormEvent) => {
    event.preventDefault();
    const duration = Math.min(365, Math.max(1, Number(eventDuration) || 1));
    const nextEvent: MonthEvent = {
      id: editingEventId || nanoid(),
      startDate: eventDate,
      title: eventTitle.trim(),
      color: eventColor,
      duration,
      time: eventTime || undefined,
    };

    saveMonthEvent(nextEvent);
    closeEditor();
  };

  const deleteEvent = () => {
    if (!editingEventId) return;
    deleteMonthEvent(editingEventId);
    closeEditor();
  };

  const changeMonth = (offset: number) => {
    setVisibleMonth((current) => new Date(current.getFullYear(), current.getMonth() + offset, 1));
  };

  return (
    <>
      <section className="app-surface month-calendar" aria-label="Календарь месяца">
        <div className="month-calendar-head">
          <div>
            <span className="month-calendar-kicker"><CalendarDays className="size-4" /> План на месяц</span>
            <h2>{visibleMonth.toLocaleDateString("ru-RU", { month: "long", year: "numeric" })}</h2>
          </div>
          <div className="month-calendar-nav">
            <button type="button" className="icon-button is-small" onClick={() => changeMonth(-1)} aria-label="Предыдущий месяц"><ChevronLeft className="size-5" /></button>
            <button type="button" className="month-calendar-today" onClick={() => setVisibleMonth(new Date(today.getFullYear(), today.getMonth(), 1))}>Сегодня</button>
            <button type="button" className="icon-button is-small" onClick={() => changeMonth(1)} aria-label="Следующий месяц"><ChevronRight className="size-5" /></button>
          </div>
        </div>

        <div className="month-calendar-weekdays" aria-hidden="true">
          {WEEKDAYS.map((day) => <span key={day}>{day}</span>)}
        </div>

        <div className="month-calendar-grid">
          {calendarDays.map((date) => {
            const dateString = formatDateToDateString(date);
            const dayEvents = events.filter((event) => coversDate(event, dateString));
            const primaryEvent = dayEvents[0];
            const isOutsideMonth = date.getMonth() !== visibleMonth.getMonth();
            const style = primaryEvent ? { "--day-color": primaryEvent.color } as CSSProperties : undefined;

            return (
              <button
                key={dateString}
                type="button"
                onClick={() => openDay(date)}
                className={`month-calendar-day ${isOutsideMonth ? "is-outside" : ""} ${isSameDay(date, today) ? "is-today" : ""} ${primaryEvent ? "has-event" : ""}`}
                style={style}
                aria-label={`${getReadableDate(dateString)}${dayEvents.length ? `, событий: ${dayEvents.length}` : ", без событий"}`}
              >
                <span className="month-day-number">{date.getDate()}</span>
                <span className="month-day-events">
                  {dayEvents.slice(0, 3).map((event) => (
                    <span key={event.id} className="month-event-pill" style={{ "--event-color": event.color } as CSSProperties}>
                      {event.time && <Clock className="size-3" />}
                      <span>{event.startDate === dateString ? (event.title || "Цветной день") : "Продолжение"}</span>
                      {event.time && event.startDate === dateString && <time>{event.time}</time>}
                    </span>
                  ))}
                  {dayEvents.length > 3 && <span className="month-event-more">+{dayEvents.length - 3}</span>}
                </span>
              </button>
            );
          })}
        </div>

        <p className="month-calendar-hint">Нажмите на день, чтобы выбрать цвет, добавить событие, время и длительность.</p>
      </section>

      <FormModal
        title={editingEventId ? "Изменить событие" : "Настроить день"}
        isOpen={isEditorOpen}
        onClose={closeEditor}
        onSubmit={saveEvent}
        submitText="Сохранить"
      >
        <FormInput label="Дата начала" value={eventDate} onChange={setEventDate} type="date" />
        <FormInput label="Событие" value={eventTitle} onChange={setEventTitle} placeholder="Например, отпуск или важная встреча" />
        <div className="month-event-form-row">
          <FormInput label="Время" value={eventTime} onChange={setEventTime} type="time" />
          <FormInput label="Сколько дней длится" value={eventDuration} onChange={setEventDuration} type="number" />
        </div>
        <AdvancedColorPicker label="Цвет дня и события" value={eventColor} onChange={setEventColor} />
        {editingEventId && (
          <button type="button" className="month-event-delete" onClick={deleteEvent}><Trash2 className="size-4" /> Удалить событие</button>
        )}
      </FormModal>
    </>
  );
}
