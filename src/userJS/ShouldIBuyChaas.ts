class ShouldIBuyChaas {
    cashInWallet: number;
    creditCard: string;
    pintsOfChaasRemaining: number;

    goToStore() {
        return (this.pintsOfChaasRemaining == 0 && (this.cashInWallet > 2 || this.creditCard==='yes')) ? "yes" : "no";
    }
}
