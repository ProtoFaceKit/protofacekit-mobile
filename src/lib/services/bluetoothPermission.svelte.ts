import { checkPermissions } from "@mnlphlp/plugin-blec";

export interface BluetoothPermissionInterface {
    checking: boolean;
    granted: boolean;

    check: VoidFunction;
    cancel: VoidFunction;
    grant: VoidFunction;
}

export function createBluetoothPermissionInterface(): BluetoothPermissionInterface {
    let checking = $state(false);
    let granted = $state(false);

    let abortGrant: AbortController | undefined;

    function tryCheckPermission(grant: boolean) {
        abortGrant?.abort();

        checking = true;

        const abort = new AbortController();
        abortGrant = abort;

        checkPermissions(grant)
            .then((value) => {
                if (abort.signal.aborted) return;
                granted = value;
            })
            .catch((error) => {
                console.error("failed to check permissions", error);
            })
            .finally(() => {
                if (abort.signal.aborted) return;
                checking = false;
            });
    }

    return {
        get checking() {
            return checking;
        },

        get granted() {
            return granted;
        },

        check() {
            tryCheckPermission(false);
        },

        cancel() {
            checking = false;
            granted = false;
            abortGrant?.abort();
        },

        grant() {
            tryCheckPermission(true);
        },
    };
}
