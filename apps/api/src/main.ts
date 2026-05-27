async function bootstrap() {
  const port = Number(process.env.PORT ?? 4000);
  console.log(`Gym API starting on port ${port}`);
}

bootstrap();
