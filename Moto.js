// ======================================================
// Arquivo: js/Moto.js
// Descrição: Classe para Motocicleta.
// ======================================================


 class Moto extends Veiculo {
    // Herda construtor e métodos

    /** Sobrescreve para identificador visual. */
    exibirInformacoes() {
        return `[Moto] ${super.exibirInformacoesBase()} <i class="fas fa-motorcycle"></i>`;
    }
}