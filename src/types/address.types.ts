export interface Address {
    address_id: number;
    user_id: number;
    recipient_name: string;
    phone: string;
    is_default: boolean;
    address_details: string;
    created_at: string;
}

export interface CreateAddressDto {
    recipient_name: string;
    phone: string;
    address_details: string;
    is_default?: boolean;
}

export interface UpdateAddressDto {
    recipient_name?: string;
    phone?: string;
    address_details?: string;
    is_default?: boolean;
}
