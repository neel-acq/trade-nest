import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { Public } from '@/common/decorators/public.decorator';
import { Roles } from '@/common/decorators/roles.decorator';
import { AuthenticatedUser } from '../../auth/interfaces/authenticated-user.interface';
import { CreateUserDto } from '../dto/create-user.dto';
import { QueryUsersDto } from '../dto/query-users.dto';
import { UpdateProfileDto } from '../dto/update-profile.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { UserService } from '../services/user.service';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Public()
  @Get('status')
  getStatus() {
    return this.userService.getStatus();
  }

  @Roles(UserRole.ADMIN)
  @Get()
  listUsers(@Query() query: QueryUsersDto) {
    return this.userService.listUsers(query);
  }

  @Patch('me')
  updateProfile(@CurrentUser() user: AuthenticatedUser, @Body() dto: UpdateProfileDto) {
    return this.userService.updateProfile(user.id, dto);
  }

  @Roles(UserRole.ADMIN)
  @Get(':id')
  async getUser(@Param('id') id: string) {
    const user = await this.userService.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  @Roles(UserRole.ADMIN)
  @Post()
  createUser(@CurrentUser() admin: AuthenticatedUser, @Body() dto: CreateUserDto) {
    return this.userService.createUser(dto, admin.id);
  }

  @Roles(UserRole.ADMIN)
  @Patch(':id')
  updateUser(
    @Param('id') id: string,
    @CurrentUser() admin: AuthenticatedUser,
    @Body() dto: UpdateUserDto,
  ) {
    return this.userService.updateUser(id, dto, admin.id);
  }

  @Roles(UserRole.ADMIN)
  @Delete(':id')
  deleteUser(@Param('id') id: string, @CurrentUser() admin: AuthenticatedUser) {
    return this.userService.deleteUser(id, admin.id);
  }
}
