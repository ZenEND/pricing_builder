# Pricing Builder

React-редактор прейскуранта з експортом у PDF (Vite + TypeScript).

## Локальний запуск

```bash
npm install
npm run dev
```

## Збірка

```bash
npm run build
npm run preview
```

## Деплой на GitHub Pages

Репозиторій: `https://github.com/ZenEND/pricing_builder`  
Сайт після деплою: **https://zenend.github.io/pricing_builder/**

### Кроки (один раз)

1. Запуште код на GitHub:

```bash
git push -u origin main
```

2. У GitHub відкрийте репозиторій → **Settings** → **Pages**
3. У блоці **Build and deployment** → **Source** оберіть **GitHub Actions**
4. Відкрийте вкладку **Actions** і дочекайтесь workflow **Deploy to GitHub Pages** (зелена галочка)

Після цього сайт буде доступний за адресою вище. Кожен наступний `git push` у `main` оновлює сайт автоматично.

### Якщо деплой не стартував

- Переконайтесь, що файл є: `.github/workflows/deploy.yml`
- У **Actions** натисніть **Deploy to GitHub Pages** → **Run workflow**
- Якщо Pages просить підтвердити environment — натисніть **Review deployments** → **Approve**
