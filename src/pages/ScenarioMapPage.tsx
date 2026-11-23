import { Link } from 'react-router-dom';
import type { ReactNode } from 'react';
import { METRIKA_COUNTER_ID } from '@/analytics/metrika';
import s from './ScenarioMapPage.module.css';

type Screen = {
  number: string;
  title: string;
  eyebrow: string;
  goal: string;
  step: string;
  preview: ReactNode;
};

const screens: Screen[] = [
  {
    number: '01',
    title: 'Старт',
    eyebrow: 'Ипотека на Циане',
    goal: 'mortgage_screen_view',
    step: 'step: 0',
    preview: (
      <>
        <div className={s.previewCover}>
          <span>⌂</span>
          <b>₽</b>
          <span>✓</span>
        </div>
        <h3>Поможем подобрать ипотеку</h3>
        <p>Ответьте на несколько вопросов</p>
        <button type="button">Подобрать ипотеку</button>
      </>
    ),
  },
  {
    number: '02',
    title: 'Контакты',
    eyebrow: 'Шаг 1 · контакты',
    goal: 'mortgage_screen_view',
    step: 'step: 1',
    preview: (
      <>
        <h3>Куда отправить подборку?</h3>
        <label>
          ФИО <span>Екатерина Смирнова</span>
        </label>
        <label>
          Телефон <span>+7 916 123-45-67</span>
        </label>
        <label>
          Почта <span>ekaterina@…</span>
        </label>
        <button type="button">Продолжить</button>
      </>
    ),
  },
  {
    number: '03',
    title: 'Планы',
    eyebrow: 'Шаг 2 · планы',
    goal: 'mortgage_screen_view',
    step: 'step: 2',
    preview: (
      <>
        <h3>Расскажите о покупке</h3>
        <strong>Когда планируете?</strong>
        <i>В течение месяца</i>
        <strong>Какую ипотеку?</strong>
        <i>Семейная ипотека</i>
        <small>Для семейной ипотеки — вопрос о помощи с объектом</small>
      </>
    ),
  },
  {
    number: '04',
    title: 'Детали',
    eyebrow: 'Шаг 3 · детали',
    goal: 'mortgage_screen_view',
    step: 'step: 3',
    preview: (
      <>
        <h3>Выберите время звонка</h3>
        <strong>Ваш доход в месяц</strong>
        <i>100–200 000 ₽</i>
        <label>
          Дата <span>Завтра</span>
        </label>
        <label>
          Время <span>13:00–16:00</span>
        </label>
        <button type="button">Отправить заявку</button>
      </>
    ),
  },
  {
    number: '05',
    title: 'Подтверждение',
    eyebrow: 'Заявка отправлена',
    goal: 'mortgage_screen_view',
    step: 'step: success',
    preview: (
      <>
        <div className={s.successMark}>✓</div>
        <h3>Спасибо, Екатерина!</h3>
        <p>Эксперт позвонит завтра, 13:00–16:00</p>
        <button type="button">Понятно</button>
      </>
    ),
  },
];

const transitions = [
  ['mortgage_start', 'step: 1'],
  ['mortgage_step_completed', 'step: 1 → 2'],
  ['mortgage_step_completed', 'step: 2 → 3'],
  ['mortgage_application_sent', 'step: 3'],
];

function Connector({ goal, step }: { goal: string; step: string }) {
  return (
    <div className={s.connector} aria-label={`${goal}, ${step}`}>
      <span>{goal}</span>
      <em>{step}</em>
      <b aria-hidden="true">→</b>
    </div>
  );
}

export function ScenarioMapPage() {
  return (
    <main className={s.page}>
      <header className={s.header}>
        <div>
          <Link to="/mortgage" className={s.back}>
            ← К прототипу
          </Link>
          <p className={s.kicker}>Ипотека · карта сценария</p>
          <h1>От первого клика до звонка эксперта</h1>
          <p className={s.intro}>
            Карта показывает основные экраны мобильного сценария и цели, которые отправляет
            прототип. Счётчик: <code>{METRIKA_COUNTER_ID}</code> — заглушка для подключения.
          </p>
        </div>
        <Link to="/mortgage" className={s.openPrototype}>
          Открыть сценарий <span>↗</span>
        </Link>
      </header>

      <section className={s.mapSection} aria-labelledby="map-title">
        <div className={s.sectionHeading}>
          <div>
            <p className={s.kicker}>Пользовательский поток</p>
            <h2 id="map-title">Экран → событие → следующий экран</h2>
          </div>
          <p className={s.legend}>
            <span className={s.dot} /> событие Метрики
          </p>
        </div>

        <div className={s.flow}>
          {screens.map((screen, index) => (
            <div className={s.flowItem} key={screen.number}>
              <article className={s.node}>
                <div className={s.nodeHeading}>
                  <span>{screen.number}</span>
                  <div>
                    <p>{screen.eyebrow}</p>
                    <h3>{screen.title}</h3>
                  </div>
                </div>
                <div className={s.phone}>
                  <div className={s.phoneTop}>
                    <b>Ц</b>
                    <span>Ипотека</span>
                  </div>
                  <div className={s.phoneContent}>{screen.preview}</div>
                </div>
                <div className={s.goal}>
                  <span>{screen.goal}</span>
                  <code>{screen.step}</code>
                </div>
              </article>
              {index < transitions.length && (
                <Connector goal={transitions[index][0]} step={transitions[index][1]} />
              )}
            </div>
          ))}
        </div>
        <div className={s.returnPath}>
          <span>После «Понятно»</span>
          <b>↩</b>
          <code>mortgage_restart · step: success → 0</code>
        </div>
      </section>

      <section className={s.experiment} aria-labelledby="experiment-title">
        <div className={s.experimentTitle}>
          <p className={s.kicker}>План эксперимента</p>
          <h2 id="experiment-title">A/B-тест стартового экрана</h2>
        </div>
        <div className={s.experimentGrid}>
          <article>
            <h3>Гипотеза</h3>
            <p>
              Если до CTA показать, какие данные понадобятся и что звонок можно назначить на удобное
              время, больше пользователей начнут и завершат заявку.
            </p>
          </article>
          <article>
            <h3>Вариант B</h3>
            <p>
              На старте заменить общий блок выгод на компактный «Что будет дальше»: 3 вопроса,
              подборка вариантов и выбор времени звонка. CTA остаётся тем же.
            </p>
          </article>
          <article>
            <h3>Основная метрика</h3>
            <p>
              <code>mortgage_application_sent / mortgage_screen_view(step: 0)</code> — доля
              отправленных заявок от посетителей старта.
            </p>
          </article>
          <article>
            <h3>Ограничивающая метрика</h3>
            <p>
              Доля возвратов со шага 1 не должна вырасти более чем на 2 п.п.; это защитит от
              «случайных» стартов без намерения.
            </p>
          </article>
        </div>
        <div className={s.sample}>
          <div>
            <span>Размер выборки</span>
            <strong>6 000</strong>
            <p>посетителей старта, по 3 000 на вариант</p>
          </div>
          <div>
            <span>Длительность</span>
            <strong>≈ 20 дней</strong>
            <p>при 300 уникальных посетителях в день</p>
          </div>
          <div>
            <span>Расчёт</span>
            <strong>20% → 23%</strong>
            <p>95% доверие, 80% мощность, MDE +3 п.п.</p>
          </div>
        </div>
      </section>
    </main>
  );
}
