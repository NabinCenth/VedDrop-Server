import { customAlphabet } from 'nanoid';
export function generatePin():Number{
    const nanoid = customAlphabet('0123456789', 6);
    return Number(nanoid());
}
export function generateStorageKey(){
    const nanoid = customAlphabet('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', 21);
    return nanoid();
}