import { Account, EmailToken, PasswordResetToken } from "@prisma/client";
import Status from "../enums/status.enum.ts";


interface _User {
    id: string;
    email: string;
    password?: string;
    name: string | null;
    emailVerified: boolean;
    emailTokens: EmailToken[];
    passwordResetTokens: PasswordResetToken[];
    accounts: Account[];
    createdAt: Date;
    updatedAt: Date;
}

interface _ValidationError {
    message: string,
    status: Status,
}

export interface EmailValidationError extends _ValidationError {
    emailValidationsErrors: string[],
}

export interface PasswordValidationError extends _ValidationError { }

export interface ServerError {
    message: string,
    status: Status,
}

// Create user route types
export interface CreateUserRequestBody {
    email: string;
    password: string;
}

export interface CreatedUser extends _User {
    message: string;
    status: Status;
}

// Login user route types
export interface LoggedInUser extends _User {
    message: string;
    status: Status;
}

interface UserPersonalInformation {
    firstName?: string;
    middleName?: string;
    surname?: string;
}


export interface CollectNameRequestBody extends UserPersonalInformation { }

export interface UpdateNameRequestBody extends UserPersonalInformation { }