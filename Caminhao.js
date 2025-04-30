// ======================================================
// Arquivo: js/Caminhao.js
// Descrição: Classe para Caminhão com carga.
// ======================================================

// Importa funções de script.js


 class Caminhao extends Veiculo {
    capacidadeCarga;
    cargaAtual;

    constructor(modelo, cor, nickname, capacidadeCarga, imagem, ligado, velocidade, fuelLevel, historicoManutencao, cargaAtual = 0) {
        super(modelo, cor, nickname, imagem, ligado, velocidade, fuelLevel, historicoManutencao);
        const capNum = parseInt(capacidadeCarga);
        if (isNaN(capNum) || capNum <= 0) throw new Error("Capacidade de carga inválida para Caminhão.");
        this.capacidadeCarga = capNum;
        // Garante que carga inicial não exceda capacidade
        this.cargaAtual = Math.max(0, Math.min(parseInt(cargaAtual) || 0, this.capacidadeCarga));
    }

    /** Adiciona carga ao caminhão. */
    carregar(quantidade) {
        const quantNum = parseInt(quantidade);
        if (isNaN(quantNum) || quantNum <= 0) { showNotification("Quantidade para carregar inválida.", "warning"); return; }
        const espacoDisponivel = this.capacidadeCarga - this.cargaAtual;
        if (quantNum > espacoDisponivel) { showNotification(`Não cabe! Espaço livre: ${espacoDisponivel}.`, "warning"); return; }
        this.cargaAtual += quantNum;
        showNotification(`${quantNum} unidades carregadas (Total: ${this.cargaAtual}/${this.capacidadeCarga}).`, 'info');
        this.updateDisplay(); // Atualiza UI
        salvarGaragem();    // Salva estado
    }

    /** Remove carga do caminhão. */
    descarregar(quantidade) {
        const quantNum = parseInt(quantidade);
        if (isNaN(quantNum) || quantNum <= 0) { showNotification("Quantidade para descarregar inválida.", "warning"); return; }
        if (quantNum > this.cargaAtual) { showNotification(`Não há ${quantNum} unidades para descarregar (Atual: ${this.cargaAtual}).`, "warning"); return; }
        this.cargaAtual -= quantNum;
        showNotification(`${quantNum} unidades descarregadas (Restante: ${this.cargaAtual}/${this.capacidadeCarga}).`, 'info');
        this.updateDisplay(); // Atualiza UI
        salvarGaragem();    // Salva estado
    }

    /** Sobrescreve para incluir informações de carga. */
    exibirInformacoes() {
        return `[Caminhão] ${super.exibirInformacoesBase()}, Carga: ${this.cargaAtual}/${this.capacidadeCarga} <i class="fas fa-truck"></i>`;
    }
}