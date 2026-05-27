async function bootstrap() {
  const port = Number(process.env.PORT ?? 4001);
  console.log(`Gym Auth service starting on port ${port}`);
}

bootstrap();
