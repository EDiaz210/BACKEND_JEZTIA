(async () => {
  // Aplicar fixes whatsapp PRIMERO
  try {
    await import('../fix.whatsapp.js');
    console.log('[INIT] Fix whatsapp aplicado');
  } catch (err) {
    console.warn('[INIT] Error aplicando fix:', err.message);
  }

  // Pequeño delay para asegurar que los fixes se apliquen
  await new Promise(r => setTimeout(r, 500));

  const { app } = await import('./server.js');
  const connection = await import('./database.js').then(m => m.default);

  connection();

  app.listen(app.get('port'), () => {
    console.log(`Server ok on http://localhost:${app.get('port')}`);
  });
})();