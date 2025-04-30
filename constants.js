// ======================================================
// @file constants.js
// @description Constantes globais da aplicação Garagem Inteligente.
// ======================================================

// Define o objeto Constants globalmente
const Constants = {
    // Chave para o Local Storage
    STORAGE_KEY: 'garagemInteligenteData', // Ou o nome que você preferir

    // Duração padrão das notificações (em milissegundos)
    NOTIFICATION_DURATION: 3500,

    // Velocidade máxima para a barra de progresso visual (não limita a velocidade real)
    MAX_VISUAL_SPEED: 200, // Ex: km/h ou m/s, dependendo da sua lógica

    // Nível de combustível padrão ao criar um veículo
    DEFAULT_FUEL: 100, // Ex: porcentagem ou litros

    // Capacidade padrão do tanque de combustível
    DEFAULT_FUEL_CAPACITY: 100, // Ex: porcentagem ou litros

    // Volume padrão (usado para música, caso implementado)
    DEFAULT_VOLUME: 0.5 // Valor entre 0.0 e 1.0

    // Adicione outras constantes que você possa precisar
};

https://github.com/jdsakjdsadsd/Card-pio.git

// Opcional: Congelar o objeto para evitar modificações acidentais
Object.freeze(Constants);

console.log("Constants.js carregado e objeto Constants definido:", Constants); // Log para confirmar