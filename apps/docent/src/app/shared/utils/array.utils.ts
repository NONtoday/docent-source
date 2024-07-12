import { curry } from 'lodash-es';

export const moveItemInArray = <T>(from: number, to: number, array: T[]) => {
    const data = [...array];

    const itemToMove = data.splice(from, 1)[0];
    data.splice(to, 0, itemToMove);

    return data;
};

export const insertInArray = curry(<T>(index: number, item: T, array: T[]) => {
    const newArray = [...array];
    newArray.splice(index, 0, item);
    return newArray;
});

export const replaceInArray = <T>(index: number, item: T, array: T[]) => {
    const newArray = [...array];
    newArray.splice(index, 1, item);
    return newArray;
};
