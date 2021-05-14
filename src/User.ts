export class User {
    id: number;
    name: string;
    roles: any[] | undefined;
    constructor(id: number, name: string) {
        this.id = id;
        this.name = name;
    }
}
