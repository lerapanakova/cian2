import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { MortgagePage } from './MortgagePage';

function renderPage() {
  return render(
    <MemoryRouter>
      <MortgagePage />
    </MemoryRouter>,
  );
}

async function openPlansStep(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: 'Подобрать ипотеку' }));
  await user.click(screen.getByRole('button', { name: 'Продолжить' }));
}

async function fillPlansStep(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByLabelText('В течение месяца'));
  await user.click(screen.getByLabelText('Да, уже выбрал(а)'));
  await user.click(screen.getByLabelText('Семейная ипотека'));
  await user.click(screen.getByLabelText('Да, помогите подобрать'));
  await user.click(screen.getByRole('button', { name: 'Продолжить' }));
}

describe('MortgagePage', () => {
  it('shows profile contacts and validates the editable email', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: 'Подобрать ипотеку' }));
    expect(screen.getByLabelText('ФИО')).toHaveValue('Екатерина Смирнова');
    expect(screen.getByLabelText('Телефон')).toBeDisabled();

    await user.clear(screen.getByLabelText('Почта'));
    await user.type(screen.getByLabelText('Почта'), 'неверный адрес');
    await user.click(screen.getByRole('button', { name: 'Продолжить' }));

    expect(screen.getByText('Укажите почту в формате name@example.ru')).toBeInTheDocument();
  });

  it('shows the consultant question only for family mortgage or new builds', async () => {
    const user = userEvent.setup();
    renderPage();
    await openPlansStep(user);

    await user.click(screen.getByLabelText('Другое'));
    expect(
      screen.queryByText('Нужна помощь консультанта с подбором объекта?'),
    ).not.toBeInTheDocument();

    await user.click(screen.getByLabelText('Новостройка'));
    expect(screen.getByText('Нужна помощь консультанта с подбором объекта?')).toBeInTheDocument();
  });

  it('requires a loan payment only when the user has existing loans', async () => {
    const user = userEvent.setup();
    renderPage();
    await openPlansStep(user);
    await fillPlansStep(user);

    await user.click(screen.getByRole('button', { name: '200–350 000 ₽' }));
    await user.click(screen.getByLabelText('Да'));
    expect(screen.getByLabelText('Ежемесячный платёж по кредитам')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Отправить заявку' }));
    expect(screen.getByText('Укажите ежемесячный платёж')).toBeInTheDocument();
  });

  it('submits the completed form and confirms the selected call time', async () => {
    const user = userEvent.setup();
    renderPage();
    await openPlansStep(user);
    await fillPlansStep(user);

    await user.click(screen.getByRole('button', { name: '100–200 000 ₽' }));
    await user.click(screen.getByLabelText('Нет'));
    const date = screen.getByLabelText('Дата') as HTMLSelectElement;
    await user.selectOptions(date, date.options[1].value);
    await user.selectOptions(screen.getByLabelText('Время'), '13:00–16:00');
    await user.click(screen.getByRole('button', { name: 'Отправить заявку' }));

    expect(screen.getByRole('heading', { name: 'Спасибо, Екатерина!' })).toBeInTheDocument();
    expect(screen.getByText(/13:00–16:00/)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Понятно' }));
    expect(screen.getByRole('button', { name: 'Подобрать ипотеку' })).toBeInTheDocument();
  });
});
