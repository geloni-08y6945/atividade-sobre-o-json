// ======================================================
// Arquivo: js/CarroEsportivo.js
// Descrição: Classe para Carro Esportivo com turbo.
// ======================================================


// Importa funções de script.js que este método usa


 class CarroEsportivo extends Veiculo {
    turboAtivado;

    constructor(modelo, cor, nickname, imagem, ligado, velocidade, fuelLevel, historicoManutencao, turboAtivado = false) {
        super(modelo, cor, nickname, imagem, ligado, velocidade, fuelLevel, historicoManutencao);
        this.turboAtivado = Boolean(turboAtivado);
    }

    /** Ativa o turbo. */
    ativarTurbo() {
        if (!this.ligado) { showNotification("Ligue o carro antes.", "warning"); return; }
        if (this.turboAtivado) return; // Já ativo
        if (!this.consumirCombustivel(Constants.TURBO_ACTIVATION_FUEL_COST)) {
            showNotification("Sem combustível para ativar o turbo!", "warning");
            return; // Consumir já tratou UI/Save
        }
        playSound("turbo", this.volume);
        this.turboAtivado = true;
        showNotification("Turbo ATIVADO!", 'success');
        this.updateDisplay(); // Atualiza UI (via Veiculo -> script.js)
        salvarGaragem();    // Salva estado
    }

    /** Sobrescreve para adicionar status do turbo. */
    exibirInformacoes() {
        const turboStatus = this.turboAtivado ? 'Ligado <i class="fas fa-fire" style="color: orange;"></i>' : 'Desligado';
        return `[Esportivo] ${super.exibirInformacoesBase()}, Turbo: ${turboStatus}`;
    }

    // Método desligar é herdado e já trata turboAtivado = false
}