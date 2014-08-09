class LoginDialogDriver {
    userName: string;
    password: string;
    message: string;
    loginAttempts: number;

    constructor (userName: string, password: string) {
        this.userName = userName
        this.password = password
    }

    loginWithUsernameAndPassword(userName: string, password: string): boolean {
        this.loginAttempts ++;
        var result = (userName == this.userName && password == this.password);
        if(result) {
            this.message = userName + " logged in.";
        }
        else {
            this.message= userName + " not logged in.";
        }
        return result;
    }

    loginMessage(): string {
        return this.message;
    }
}