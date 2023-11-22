sleep 2
npm i
npx prisma generate
npm run prisma:dev:deploy
npm run start:dev & (sleep 3 && npx prisma studio)
