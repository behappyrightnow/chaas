class ShouldIBuyMilk {
    dollars: number;
    pints: number;
    _creditCard: boolean;
    cashInWallet(dollars: number) {
        this.dollars = dollars;
    }
    creditCard(valid:string) {
        this._creditCard = "yes" === valid;
    }
    pintsOfMilkRemaining(pints: number) {
        this.pints = pints;
    }

    goToStore() {
        return (this.pints == 0 && (this.dollars > 2 || this._creditCard)) ? "yes" : "no";
    }
}

class Greeter {
    hello(who:string) {
        return "Hello "+who;
    }
}