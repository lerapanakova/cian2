import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, Checkbox, Icon, Input, Radio, Select } from '@/ui';
import s from './MortgagePage.module.css';

type FormData = {
  fullName: string;
  email: string;
  phone: string;
  purchaseTime: string;
  property: string;
  mortgageProgram: string;
  consultant: string;
  incomePreset: string;
  incomeCustom: string;
  hasLoans: string;
  loanPayment: string;
  date: string;
  time: string;
  marketing: boolean;
};

const profile: FormData = {
  fullName: 'Екатерина Смирнова',
  email: 'ekaterina.smirnova@mail.ru',
  phone: '+7 916 123-45-67',
  purchaseTime: '',
  property: '',
  mortgageProgram: '',
  consultant: '',
  incomePreset: '',
  incomeCustom: '',
  hasLoans: '',
  loanPayment: '',
  date: '',
  time: '',
  marketing: false,
};

const purchaseTimes = [
  ['month', 'В течение месяца'],
  ['three-months', 'В ближайшие 1–3 месяца'],
  ['six-months', 'Через 3–6 месяцев'],
  ['exploring', 'Пока просто изучаю'],
];

const properties = [
  ['yes', 'Да, уже выбрал(а)'],
  ['choosing', 'Нет, пока выбираю'],
  ['budget', 'Хочу сначала понять доступный бюджет'],
];

const mortgagePrograms = [
  ['family', 'Семейная ипотека'],
  ['new-build', 'Новостройка'],
  ['other', 'Другое'],
];

const incomeOptions = ['до 100 000 ₽', '100–200 000 ₽', '200–350 000 ₽', 'больше 350 000 ₽'];

function toLocalDateValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getCallDates(now = new Date()) {
  return Array.from({ length: 3 }, (_, index) => {
    const date = new Date(now);
    date.setDate(now.getDate() + index + 1);
    const label = new Intl.DateTimeFormat('ru-RU', {
      weekday: 'short',
      day: 'numeric',
      month: 'long',
    }).format(date);
    return { value: toLocalDateValue(date), label: label[0].toUpperCase() + label.slice(1) };
  });
}

function ChoiceGroup({
  label,
  options,
  name,
  value,
  onChange,
  error,
}: {
  label: string;
  options: readonly (readonly string[])[];
  name: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
}) {
  return (
    <fieldset className={s.choiceGroup}>
      <legend>{label}</legend>
      <div className={s.choices}>
        {options.map(([optionValue, optionLabel]) => (
          <Radio
            key={optionValue}
            name={name}
            value={optionValue}
            label={optionLabel}
            checked={value === optionValue}
            onChange={() => onChange(optionValue)}
          />
        ))}
      </div>
      {error && <p className={s.error}>{error}</p>}
    </fieldset>
  );
}

export function MortgagePage() {
  const [screen, setScreen] = useState<'entry' | 'form' | 'success'>('entry');
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormData>(profile);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const dates = useMemo(getCallDates, []);
  const canShowConsultant =
    form.mortgageProgram === 'family' || form.mortgageProgram === 'new-build';
  const income = form.incomeCustom.trim() || form.incomePreset;

  const update = <K extends keyof FormData>(key: K, value: FormData[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: '' }));
  };

  const updateIncomePreset = (value: string) => {
    setForm((current) => ({ ...current, incomePreset: value, incomeCustom: '' }));
    setErrors((current) => ({ ...current, income: '' }));
  };

  const updateIncomeCustom = (value: string) => {
    setForm((current) => ({ ...current, incomeCustom: value, incomePreset: '' }));
    setErrors((current) => ({ ...current, income: '' }));
  };

  const validateStep = () => {
    const nextErrors: Record<string, string> = {};
    if (step === 1) {
      if (!form.fullName.trim()) nextErrors.fullName = 'Укажите имя и фамилию';
      if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email)) {
        nextErrors.email = 'Укажите почту в формате name@example.ru';
      }
    }
    if (step === 2) {
      if (!form.purchaseTime) nextErrors.purchaseTime = 'Выберите подходящий вариант';
      if (!form.property) nextErrors.property = 'Выберите подходящий вариант';
      if (!form.mortgageProgram) nextErrors.mortgageProgram = 'Выберите подходящий вариант';
      if (canShowConsultant && !form.consultant) {
        nextErrors.consultant = 'Выберите, нужна ли помощь';
      }
    }
    if (step === 3) {
      if (!income) nextErrors.income = 'Выберите сумму или укажите доход';
      if (!form.hasLoans) nextErrors.hasLoans = 'Выберите подходящий вариант';
      if (form.hasLoans === 'yes' && !form.loanPayment.trim()) {
        nextErrors.loanPayment = 'Укажите ежемесячный платёж';
      }
      if (!form.date) nextErrors.date = 'Выберите дату';
      if (!form.time) nextErrors.time = 'Выберите время';
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const continueForm = () => {
    if (!validateStep()) return;
    if (step === 3) {
      setScreen('success');
      return;
    }
    setStep((current) => current + 1);
  };

  const startOver = () => {
    setForm(profile);
    setErrors({});
    setStep(1);
    setScreen('entry');
  };

  if (screen === 'entry') {
    return (
      <main className={`${s.app} ${s.entryApp}`}>
        <header className={`${s.topbar} ${s.entryTopbar}`}>
          <span className={s.phoneSpeaker} aria-hidden="true" />
          <Link to="/" className={s.logo} aria-label="Циан, на главную">
            Ц
          </Link>
          <span>Ипотека</span>
          <button className={s.profile} type="button" aria-label="Профиль">
            ЕС
          </button>
        </header>
        <section className={s.entry}>
          <div className={s.entryVisual}>
            <img src="/images/mortgage-cover.png" alt="Яркая абстрактная иллюстрация для ипотеки" />
            <div className={s.coverIcons} aria-hidden="true">
              <span><Icon name="Home" size={34} /></span>
              <span className={s.rubleIcon}>₽</span>
              <span><Icon name="ShieldCheck" size={30} /></span>
            </div>
          </div>
          <p className={s.overline}>ИПОТЕКА НА ЦИАНЕ</p>
          <h1 className={s.entryHeading}>Поможем подобрать ипотеку</h1>
          <p className={s.lead}>
            Ответьте на несколько вопросов. Эксперт партнёра подберёт варианты и перезвонит в
            удобное время.
          </p>
          <div className={s.benefits}>
            <p>
              <span className={s.checkIcon}>
                <Icon name="ShieldCheck" size={20} />
              </span>
              Без паспортных данных и справок
            </p>
            <p>
              <span className={s.checkIcon}>
                <Icon name="Timer" size={20} />
              </span>
              Заполнение займёт около 3 минут
            </p>
          </div>
          <Button
            className={`${s.primaryButton} ${s.entryButton}`}
            theme="inverted"
            fullWidth
            size="L"
            onClick={() => setScreen('form')}
          >
            Подобрать ипотеку
          </Button>
          <p className={s.caption}>Расчёт не влияет на кредитную историю</p>
        </section>
      </main>
    );
  }

  if (screen === 'success') {
    const selectedDate = dates.find((date) => date.value === form.date)?.label;
    const firstName = form.fullName.trim().split(/\s+/)[0] || 'Екатерина';
    return (
      <main className={s.app}>
        <header className={s.topbar}>
          <Link to="/" className={s.logo} aria-label="Циан, на главную">
            Ц
          </Link>
          <span>Ипотека</span>
          <span className={s.topbarSpacer} />
        </header>
        <section className={s.success}>
          <div className={s.successIcon}>
            <Icon name="FunctionalSuccess16" size={44} />
          </div>
          <p className={s.overline}>ЗАЯВКА ОТПРАВЛЕНА</p>
          <h1>Спасибо, {firstName}!</h1>
          <p className={s.lead}>
            Ипотечный эксперт нашего партнёра позвонит вам {selectedDate?.toLowerCase()} в
            интервале {form.time}.
          </p>
          <div className={s.infoBox}>
            <Icon name="FunctionalInformationCircle16" size={20} />
            <p>Эксперт уточнит детали и поможет подготовить заявку в банк. Никуда ходить не нужно.</p>
          </div>
          <Button className={s.primaryButton} fullWidth size="L" onClick={startOver}>
            Понятно
          </Button>
        </section>
      </main>
    );
  }

  return (
    <main className={s.app}>
      <header className={s.topbar}>
        <button
          className={s.back}
          type="button"
          onClick={() => (step === 1 ? setScreen('entry') : setStep((current) => current - 1))}
        >
          <Icon name="ActionChevronLeft16" size={20} />
          Назад
        </button>
        <span>Ипотека</span>
        <span className={s.stepCounter}>{step} из 3</span>
      </header>
      <div className={s.progress} aria-label={`Шаг ${step} из 3`}>
        <span style={{ width: `${(step / 3) * 100}%` }} />
      </div>
      <form
        className={s.form}
        onSubmit={(event) => {
          event.preventDefault();
          continueForm();
        }}
        noValidate
      >
        {step === 1 && (
          <>
            <p className={s.overline}>ШАГ 1 · КОНТАКТЫ</p>
            <div className={s.formTitle}>
              <Icon name="ActionProfile24" size={28} />
              <h1>Куда отправить подборку?</h1>
            </div>
            <p className={s.lead}>
              Часть данных мы уже взяли из вашего профиля. Проверьте их, пожалуйста.
            </p>
            <div className={s.fields}>
              <div className={s.profileWidget}>
                <p className={s.widgetCaption}>
                  <Icon name="ActionProfile24" size={18} />
                  Данные из профиля
                </p>
                <Input
                  className={s.profileName}
                  label="ФИО"
                  value={form.fullName}
                  onChange={(event) => update('fullName', event.target.value)}
                  error={errors.fullName}
                />
              </div>
              <Input label="Телефон" value={form.phone} disabled hint="Номер из профиля Циана" />
              <Input
                label="Почта"
                type="email"
                value={form.email}
                onChange={(event) => update('email', event.target.value)}
                error={errors.email}
              />
            </div>
          </>
        )}
        {step === 2 && (
          <>
            <p className={s.overline}>ШАГ 2 · ПЛАНЫ</p>
            <div className={s.formTitle}>
              <Icon name="Home" size={28} />
              <h1>Расскажите о покупке</h1>
            </div>
            <div className={s.fields}>
              <ChoiceGroup
                label="Когда планируете покупку?"
                name="purchaseTime"
                options={purchaseTimes}
                value={form.purchaseTime}
                onChange={(value) => update('purchaseTime', value)}
                error={errors.purchaseTime}
              />
              <ChoiceGroup
                label="Есть ли объект для покупки?"
                name="property"
                options={properties}
                value={form.property}
                onChange={(value) => update('property', value)}
                error={errors.property}
              />
              <ChoiceGroup
                label="Какую ипотеку рассматриваете?"
                name="mortgageProgram"
                options={mortgagePrograms}
                value={form.mortgageProgram}
                onChange={(value) => update('mortgageProgram', value)}
                error={errors.mortgageProgram}
              />
              {canShowConsultant && (
                <div className={s.conditional}>
                  <ChoiceGroup
                    label="Нужна помощь консультанта с подбором объекта?"
                    name="consultant"
                    options={[
                      ['yes', 'Да, помогите подобрать'],
                      ['no', 'Нет, только ипотека'],
                    ]}
                    value={form.consultant}
                    onChange={(value) => update('consultant', value)}
                    error={errors.consultant}
                  />
                </div>
              )}
            </div>
          </>
        )}
        {step === 3 && (
          <>
            <p className={s.overline}>ШАГ 3 · ДЕТАЛИ</p>
            <div className={s.formTitle}>
              <Icon name="FunctionalCalendar24" size={28} />
              <h1>Осталось выбрать время звонка</h1>
            </div>
            <div className={s.fields}>
              <div className={s.fieldBlock}>
                <span className={s.fieldLabel}>Ваш доход в месяц</span>
                <div className={s.incomeButtons}>
                  {incomeOptions.map((option) => (
                    <button
                      type="button"
                      className={form.incomePreset === option ? s.selectedIncome : ''}
                      onClick={() => updateIncomePreset(option)}
                      key={option}
                    >
                      {option}
                    </button>
                  ))}
                </div>
                <Input
                  label="Или укажите свой доход"
                  placeholder="Например, 180 000 ₽"
                  value={form.incomeCustom}
                  onChange={(event) => updateIncomeCustom(event.target.value)}
                  error={errors.income}
                />
              </div>
              <ChoiceGroup
                label="Есть действующие кредиты?"
                name="loans"
                options={[
                  ['yes', 'Да'],
                  ['no', 'Нет'],
                ]}
                value={form.hasLoans}
                onChange={(value) => update('hasLoans', value)}
                error={errors.hasLoans}
              />
              {form.hasLoans === 'yes' && (
                <Input
                  label="Ежемесячный платёж по кредитам"
                  placeholder="Например, 25 000 ₽"
                  value={form.loanPayment}
                  onChange={(event) => update('loanPayment', event.target.value)}
                  error={errors.loanPayment}
                />
              )}
              <div className={s.callTime}>
                <h2>Когда вам удобно позвонить?</h2>
                <p>Выберите время в ближайшие три дня</p>
                <Select
                  label="Дата"
                  value={form.date}
                  onChange={(event) => update('date', event.target.value)}
                  options={[{ value: '', label: 'Выберите дату' }, ...dates]}
                />
                {errors.date && <p className={s.error}>{errors.date}</p>}
                <Select
                  label="Время"
                  value={form.time}
                  onChange={(event) => update('time', event.target.value)}
                  options={[
                    { value: '', label: 'Выберите время' },
                    { value: '10:00–13:00', label: '10:00–13:00' },
                    { value: '13:00–16:00', label: '13:00–16:00' },
                    { value: '16:00–20:00', label: '16:00–20:00' },
                  ]}
                />
                {errors.time && <p className={s.error}>{errors.time}</p>}
              </div>
              <Checkbox
                label="Хочу получать новости и персональные предложения Циана"
                checked={form.marketing}
                onChange={(event) => update('marketing', event.target.checked)}
              />
            </div>
          </>
        )}
        <div className={s.bottomAction}>
          {step === 3 && (
            <p className={s.consent}>
              Нажимая «Отправить заявку», вы принимаете{' '}
              <a href="#consents">согласие на обработку персональных данных</a> и условия сервиса.
            </p>
          )}
          <Button className={s.primaryButton} fullWidth size="L" type="submit">
            {step === 3 ? 'Отправить заявку' : 'Продолжить'}
          </Button>
        </div>
      </form>
    </main>
  );
}
