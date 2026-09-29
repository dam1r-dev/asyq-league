import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Правила — Asyq League" };

export default function RulesPage() {
  return (
    <div className="mx-auto w-full max-w-2xl px-4 pt-6 pb-16">
      <h1 className="font-display text-2xl font-bold">Правила асық ату</h1>
      <p className="mt-2 text-sm text-muted">
        Мы сохранили основу дворовой игры и упростили её для экрана. Всё, что придумано нами, отмечено
        значком <span className="author-badge">авторское</span>.
      </p>

      <Section title="Поле и фигуры">
        <ul className="list-disc space-y-1.5 pl-5">
          <li>
            <b>Кон</b> — меловой круг. Внутри него стоят асыки, обычно в ряд.
          </li>
          <li>
            <b>Сақа</b> — твой биток: крупный тяжёлый асык. Бросаешь его из-за <b>линии броска</b>.
          </li>
          <li>
            <b>Камни</b> на некоторых испытаниях не двигаются — от них сақа и асыки отскакивают.{" "}
            <span className="author-badge">авторское</span>
          </li>
        </ul>
      </Section>

      <Section title="Порядок действий">
        <ol className="list-decimal space-y-1.5 pl-5">
          <li>При желании сдвинь сақа вдоль линии кнопками ◀ ▶ (или стрелками на клавиатуре).</li>
          <li>Коснись поля и потяни назад — как рогатку. Направление задаёт угол, длина — силу (до 100%).</li>
          <li>Пунктир показывает, куда покатится сақа и где будет первый удар. Что будет после удара — решает физика.</li>
          <li>Отпусти. Когда всё остановится, начисляются очки, а сақа возвращается на линию.</li>
          <li>Потянул назад к себе — бросок отменится, если отпустить палец, пока надпись красная.</li>
        </ol>
      </Section>

      <Section title="Очки">
        <table className="w-full text-sm">
          <tbody className="[&_td]:py-2 [&_td]:align-top [&_tr]:border-b [&_tr]:border-line">
            <tr>
              <td>Асык полностью за меловой линией кона</td>
              <td className="text-right font-bold text-good">+1</td>
            </tr>
            <tr>
              <td>
                Выбил несколько асыков одним броском — за каждый сверх первого{" "}
                <span className="author-badge">авторское</span>
              </td>
              <td className="text-right font-bold text-good">+1</td>
            </tr>
            <tr>
              <td>Сақа остановилась внутри кона (как «айып» во дворе)</td>
              <td className="text-right font-bold text-bad">−1</td>
            </tr>
            <tr>
              <td>
                Кон очищен — за каждый неиспользованный бросок <span className="author-badge">авторское</span>
              </td>
              <td className="text-right font-bold text-good">+2</td>
            </tr>
          </tbody>
        </table>
        <p className="mt-3">
          Выбитый асык сразу убирается с поля, поэтому очки за него не начисляются дважды. Счёт не
          бывает меньше нуля.
        </p>
      </Section>

      <Section title="Победа">
        <ul className="list-disc space-y-1.5 pl-5">
          <li>
            <b>Испытания и испытание дня:</b> выбей все асыки до того, как кончатся броски. Уложился в норму — получишь
            ⭐⭐⭐, чуть больше бросков — ⭐⭐, иначе ⭐. <span className="author-badge">авторское</span>
          </li>
          <li>
            <b>Дуэль:</b> двое бросают по очереди по общему кону. Выбил асык и сақа не осталась в коне — бросаешь ещё
            раз (как во дворе). Игра идёт, пока кон не опустеет или не кончатся броски. Побеждает тот, у кого больше
            очков.
          </li>
          <li>
            <b>Вызов другу:</b> вы играете одну и ту же расстановку; у кого больше очков — тот и победил.
          </li>
        </ul>
      </Section>

      <Section title="Как мы адаптировали игру для браузера">
        <ul className="list-disc space-y-1.5 pl-5">
          <li>Вид сверху. Во дворе сақу бросают по воздуху, у нас она скользит по земле — так проще целиться пальцем.</li>
          <li>Для физики сақа и асыки — круги: трение о землю, упругие удары, сақа в 2,5 раза тяжелее асыка.</li>
          <li>
            Физика детерминированная: один и тот же бросок даёт один и тот же результат на любом устройстве. Поэтому
            сервер пересчитывает каждый бросок сам и засчитывает только честные очки.
          </li>
          <li>
            Сторона, которой упал выбитый асык (алшы, тәйкі, бүк, шік), показывается для атмосферы и на очки не
            влияет. <span className="author-badge">авторское</span>
          </li>
        </ul>
      </Section>

      <div className="mt-8 flex gap-3">
        <Link href="/play/l1" className="btn btn-primary">
          Пройти обучение
        </Link>
        <Link href="/levels" className="btn btn-ghost">
          К испытаниям
        </Link>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="card mt-5 p-5 text-[15px] leading-relaxed">
      <h2 className="mb-3 font-display text-lg font-bold">{title}</h2>
      {children}
    </section>
  );
}
