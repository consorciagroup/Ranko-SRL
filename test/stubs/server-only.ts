// Stub vacío de "server-only" para el entorno de test. En el build de Next este
// import lo resuelve el bundler (marca un módulo como solo-servidor); Vitest no
// tiene ese alias, así que lo mapeamos acá a un módulo vacío para poder importar
// código de servidor (menu.ts, route.ts) y testear sus funciones puras.
export {};
