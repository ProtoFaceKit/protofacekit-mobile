import { watch } from "runed";

interface StateWithInitial<T> {
    current: T;
}

export function stateWithInitial<T>(initial: () => T): StateWithInitial<T> {
    let value = $state(initial());

    watch(
        () => initial,
        (initial) => {
            value = initial();
        },
    );

    return {
        get current() {
            return value;
        },
        set current(newValue) {
            value = newValue;
        },
    };
}
