# Промо-ролик ипотеки

`mortgage-promo-source-slide.png` — слайд, который используется первым кадром.
`mortgage-promo-cover.png` — итоговая обложка с заменённым заголовком.

Видео намеренно не хранится в Git. Для локального рендера после запуска прототипа:

```sh
swift -module-cache-path /private/tmp/mortgage-promo-swift-cache \
  scripts/render_promo.swift \
  public/promo/mortgage-promo-source-slide.png \
  public/promo
```

Скрипт снимает экраны с `http://127.0.0.1:5180` и создаёт `mortgage-promo.mp4` — 15 секунд, без аудио.
