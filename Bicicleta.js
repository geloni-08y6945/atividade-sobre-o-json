// ======================================================
// Arquivo: js/Bicicleta.js
// Descrição: Classe para Bicicleta.
// ======================================================

// Importa apenas o que é realmente usado aqui


 class Bicicleta extends Veiculo {
    tipo; // 'montanha', 'estrada', 'urbana'

    constructor(modelo, cor, nickname, tipo, imagem, velocidade = 0, historicoManutencao = []) {
        // Chama super com valores fixos para ligado e fuelLevel
        super(modelo, cor, nickname, imagem, false, velocidade, 0, historicoManutencao);
        const tiposValidos = ['montanha', 'estrada', 'urbana'];
        this.tipo = tiposValidos.includes(tipo) ? tipo : 'urbana'; // Garante tipo válido
    }

    // --- Sobrescritas para Métodos Não Aplicáveis ---
    ligar() { showNotification("Bicicletas não ligam!", 'info'); }
    desligar() { showNotification("Bicicletas não desligam!", 'info'); }
    consumirCombustivel(quantidade) { return true; } // Nunca consome
    reabastecer() { showNotification("Bicicletas não usam combustível!", 'info'); }
    tocarMusica() { showNotification("Bicicleta sem sistema de som.", 'info'); }
    setMusica(audioElement, nomeArquivo) { showNotification("Não é possível carregar música em bicicleta.", 'info'); }

    // Ações acelerar, frear, buzinar são tratadas em Veiculo.js via 'instanceof Bicicleta'

    /** Sobrescreve para adicionar tipo e ícone. */
    exibirInformacoes() {
        const tipoIcon = this.tipo === 'montanha' ? 'fa-mountain' : this.tipo === 'estrada' ? 'fa-road' : 'fa-city';
        return `[Bicicleta] ${super.exibirInformacoesBase()}, Tipo: ${this.tipo} <i class="fas ${tipoIcon}"></i>`;
    }

    /** Sobrescreve para ajustar dados salvos. */
    toPlainObject() {
        const plain = super.toPlainObject(); // Pega dados base
        plain.tipo = this.tipo;             // Adiciona tipo específico
        // Remove dados irrelevantes herdados
        delete plain.fuelLevel;
        delete plain.ligado;
        delete plain.musicaNome;
        plain.tipoVeiculo = 'Bicicleta';    // Garante tipo correto para recriação
        return plain;
    }
}