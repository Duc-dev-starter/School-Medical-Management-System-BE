import type { ChangeStreamDocument } from 'mongodb';
import { Types } from 'mongoose';

export type ExtendedChangeStreamDocument<T> = ChangeStreamDocument<T> & {
    documentKey?: {
        _id?: Types.ObjectId;
        [key: string]: any;
    };
};
