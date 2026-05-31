FROM oven/bun:1.1.38

WORKDIR /app

COPY package.json bun.lockb* ./
RUN bun install

COPY . .

EXPOSE 3000

CMD ["bun", "src/index.ts"]
