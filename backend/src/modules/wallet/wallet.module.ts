import { Module } from "@nestjs/common";
import { WalletController } from "./controllers/wallet.controller";
import { WalletService } from "./services/wallet.service";
import { WalletRepository } from "./repositories/wallet.repository";
import { UserModule } from "../user/user.module";
import { UserCreatedListener } from "./listeners/user-created.listener";

@Module({
  imports: [UserModule],
  controllers: [WalletController],
  providers: [WalletService, WalletRepository, UserCreatedListener],
  exports: [WalletService],
})
export class WalletModule {}
