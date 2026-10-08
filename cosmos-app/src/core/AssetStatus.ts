export interface AssetStatus {
    loading: boolean;
    loaded: number;
    total: number;
    failed: string[];
}

export const EMPTY_ASSET_STATUS: AssetStatus = { loading: false, loaded: 0, total: 0, failed: [] };
