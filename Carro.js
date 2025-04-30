// ======================================================
// Arquivo: js/Carro.js
// Descrição: Classe para Carro comum.
// ======================================================


 class Carro extends Veiculo {
    // Herda construtor e a maioria dos métodos

    /** Sobrescreve para adicionar identificador visual. */
    exibirInformacoes() {
        return `[Carro] ${super.exibirInformacoesBase()} <i class="fas fa-car-side"></i>`;
    }
}