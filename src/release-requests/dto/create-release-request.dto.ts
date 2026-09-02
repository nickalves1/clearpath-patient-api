import { ArrayNotEmpty, IsArray, IsDateString, IsString } from "class-validator";

export class CreateReleaseRequestDto {
    @IsString()
    patientId!: string;

    @IsArray()
    @ArrayNotEmpty()
    @IsString({ each: true })
    hospitalIds!: string[];

    @IsDateString()
    dateRangeFrom!: string;

    @IsDateString()
    dateRangeTo!: string;
}