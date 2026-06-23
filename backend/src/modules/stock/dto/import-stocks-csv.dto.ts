import { IsNotEmpty, IsString } from 'class-validator';

export class ImportStocksCsvDto {
  @IsString()
  @IsNotEmpty()
  csv!: string;
}
