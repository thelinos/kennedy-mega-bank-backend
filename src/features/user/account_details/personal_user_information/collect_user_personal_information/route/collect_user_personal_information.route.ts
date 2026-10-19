import express, { Request, Response, Router } from "express"
import { getPrismaClient } from "../../../../../../shared/database/prisma.ts";
// import { UserPersonalInformation } from "../../../../../../shared/types/model/data_types.ts";

export class CollectUserPersonalInformation {
    constructor() { }
    private get router() {
        return express.Router();
    }

    private get prismaClient() {
        return getPrismaClient();
    }

    private async _collectUserPersonalInformationController(req: Request<{ id: string }, never, CollectUserPersonalInformation>, res: Response): Promise<void> {
        const userId = req.params.id;

        const user = await this.prismaClient.user.findUniqueOrThrow({ where: { id: userId } });

        // if(user.)
    }

    private get _collectUserPersonalInformationRoute(): Router {
        return this.router.post("/:id/collect-personal-information", this._collectUserPersonalInformationController.bind(this));

    }

    public get collectUserPersonalInformation(): Router {
        return this._collectUserPersonalInformationRoute;
    }
}
