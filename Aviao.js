// ======================================================
// Arquivo: js/Aviao.js
// Descrição: Classe para Avião com capacidade de voo.
// ======================================================


// Importa funções de script.js


class Aviao extends Veiculo {
    envergadura;
    altitude;
    voando;

    constructor(modelo, cor, nickname, envergadura, imagem, ligado, velocidade, fuelLevel, historicoManutencao, altitude = 0, voando = false) {
        super(modelo, cor, nickname, imagem, ligado, velocidade, fuelLevel, historicoManutencao);
        const envNum = parseFloat(envergadura);
        if (isNaN(envNum) || envNum <= 0) throw new Error("Envergadura inválida para Avião.");
        this.envergadura = envNum;
        this.altitude = Math.max(0, parseInt(altitude) || 0);
        this.voando = Boolean(voando);
    }

    /** Tenta decolar o avião. */
    decolar() {
        if (!this.ligado) { showNotification("Ligue o avião antes de decolar.", "warning"); return; }
        if (this.voando) { showNotification("Já está voando.", "info"); return; }
        if (this.velocidade < Constants.MIN_TAKEOFF_SPEED) { showNotification(`Acelere acima de ${Constants.MIN_TAKEOFF_SPEED} km/h para decolar.`, "warning"); return; }
        if (!this.consumirCombustivel(Constants.TAKEOFF_FUEL_COST)) {
            showNotification("Combustível insuficiente para decolar!", "warning");
            return; // Consumir já tratou UI/Save
        }
        playSound("decolar", this.volume);
        this.voando = true;
        this.altitude = 1000; // Altitude inicial simbólica
        showNotification("Decolagem autorizada!", 'success');
        this.updateDisplay();
        salvarGaragem();
    }

    /** Tenta aterrissar o avião. */
    aterrissar() {
        if (!this.voando) { showNotification("Já está em solo.", "info"); return; }
        if (this.velocidade > Constants.MAX_LANDING_SPEED) { showNotification(`Velocidade alta (${this.velocidade} km/h)! Reduza abaixo de ${Constants.MAX_LANDING_SPEED} km/h para pousar.`, "warning"); return; }
        playSound("aterrissar", this.volume);
        this.voando = false;
        this.altitude = 0;
        // A velocidade não é zerada automaticamente, requer frenagem após pouso.
        showNotification("Pouso realizado com sucesso!", 'success');
        this.updateDisplay();
        salvarGaragem();
    }

    /** Sobrescreve para incluir status de voo. */
    exibirInformacoes() {
        const status = this.voando
            ? `Voando a ${this.altitude}m <i class="fas fa-plane-up" style="color: skyblue;"></i>`
            : 'Em solo <i class="fas fa-plane" style="color: grey;"></i>';
        return `[Avião] ${super.exibirInformacoesBase()}, Env: ${this.envergadura}m, Status: ${status}`;
    }

    // Métodos desligar e frear são herdados e já contêm lógica para 'instanceof Aviao'
}