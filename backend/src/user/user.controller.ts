import {
  Controller,
  Post,
  Get,
  Req,
  Res,
  Delete,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  Param,
  Put,
  Body,
  HttpException,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { Request } from 'express';
import { UserService } from './user.service';
import { Observable, of } from 'rxjs';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import * as path from 'path';
import { AuthGuard } from '@nestjs/passport';
import { UpdateUserDto } from './dto';
import { User } from '@prisma/client';

export const storage = {
  storage: diskStorage({
    destination: './uploads/profileImages',
    filename: (req, file, cb) => {
      const username: string = req.user.student_username;
      const extension: string = path.parse(file.originalname).ext;
      cb(null, `${username}${extension}`);
    },
  }),
};
@Controller('users')
export class UserController {
  constructor(private userService: UserService) {}

  @UseGuards(AuthGuard('jwt'))
  @Get('/')
  async getUsers() {
    const users = await this.userService.allUsers();
    return users;
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('/leaderboard')
  async getLeaderboard() {
    const users = await this.userService.leaderboard();
    return users;
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('/leaderboard/:userId')
  async getUserPositionInRanking(@Param('userId') userId: string) {
    if (!/^\d+$/.test(userId)) {
       throw new BadRequestException("Invalid roomId. Must be a number.");
    }

    const userIdInt = parseInt(userId, 10);

  
    if (isNaN(userIdInt)) {
       throw new BadRequestException("Failed to parse roomId.");
    }
    try {
      const rankingPos = this.userService.getUserRank(userIdInt);
      return rankingPos;
    } catch (error) {
      throw error
    }

  }

  @UseGuards(AuthGuard('jwt'))
  @Post('upload')
  @UseInterceptors(FileInterceptor('file', storage))
  uploadProfile(@UploadedFile() file): Observable<{ imagePath: string }> {
    
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif','image/jpg'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new HttpException('INVALID IMAGES', HttpStatus.FORBIDDEN);
    }
    
    return of({
      imagePath: process.env.BASE_URL + 'users/profile-image/' + file.filename,
    });
  }

  @Get('profile-image/:imagename')
  findProfileImage(
    @Param('imagename') imagename,
    @Res() res,
  ): Observable<object> {
    return of(
      res.sendFile(
        path.join(process.cwd(), 'uploads/profileImages/' + imagename),
      ),
    );
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('me')
  getMe(@Req() req: Request) {
    this.userService.deepDeleteKey(req.user, "twoFactorAuthenticationSecret");
    this.userService.deepDeleteKey(req.user, "password");
    return req.user;
  }

  @UseGuards(AuthGuard('jwt'))
  @Put('me')
  async updateMe(@Req() req: Request, @Body() updateUserDto: UpdateUserDto) {
    const user = req.user as User;
    let updateUser;
    try {
      updateUser = this.userService.updateUser(user.id, updateUserDto);
    } catch (error) {
      throw error;
    }
    this.userService.deepDeleteKey(updateUser, "twoFactorAuthenticationSecret");
    this.userService.deepDeleteKey(updateUser, "password");
    return updateUser;
  }


  @UseGuards(AuthGuard('jwt'))
  @Put('me/friends/:friendUsername')
  async addFriend(
    @Req() req: Request,
    @Param('friendUsername') friendUsername: string,
  ) {
    try {
      const updatedUser = await this.userService.addFriend(
        req.user as User,
        friendUsername,
      );
      this.userService.deepDeleteKey(updatedUser, "twoFactorAuthenticationSecret");
      this.userService.deepDeleteKey(updatedUser, "password");
      return updatedUser;
    } catch (error) {
        throw error
    }

  }


  @UseGuards(AuthGuard('jwt'))
  @Delete('me/friends/:friendUsername')
  async removeFriend(
    @Req() req: Request,
    @Param('friendUsername') friendUsername: string,
  ) {
    try {
      const updatedUser = await this.userService.removeFriend(
        req.user as User,
        friendUsername,
      );
      this.userService.deepDeleteKey(updatedUser, "twoFactorAuthenticationSecret");
      this.userService.deepDeleteKey(updatedUser, "password");
      return updatedUser;
    } catch (error) {
      throw error
    }
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('profile/:username')
  async getProfile(@Param('username') username) {
    try {
      const profile = await this.userService.getProfile(username);
      this.userService.deepDeleteKey(profile, "twoFactorAuthenticationSecret");
      this.userService.deepDeleteKey(profile, "password");
      return profile;
    } catch (error) {
      throw error
    }

  }

  @UseGuards(AuthGuard('jwt'))
  @Put('me/blocks/:blockUsername')
  async addBlock(
    @Req() req: Request,
    @Param('blockUsername') blockUsername: string,
  ) {

    try {
      const updatedUser = await this.userService.addBlock(
        req.user as User,
        blockUsername,
      );
      this.userService.deepDeleteKey(updatedUser, "twoFactorAuthenticationSecret");
      this.userService.deepDeleteKey(updatedUser, "password");
      return updatedUser;
    } catch (error) {
      throw error
    }

  }


  @UseGuards(AuthGuard('jwt'))
  @Delete('me/blocks/:blockUsername')
  async removeBlock(
    @Req() req: Request,
    @Param('blockUsername') blockUsername: string,
  ) {
    try {
      const updatedUser = await this.userService.removeBlock(
        req.user as User,
        blockUsername,
      );
      this.userService.deepDeleteKey(updatedUser, "twoFactorAuthenticationSecret");
      this.userService.deepDeleteKey(updatedUser, "password");
      return updatedUser;
      return updatedUser;
    } catch (error) {
      throw error
    }

  }


  @UseGuards(AuthGuard('jwt'))
  @Get(':id')
  async getUserById(@Param('id') userId) {

    if (!/^\d+$/.test(userId)) {
      throw new BadRequestException('Invalid Id. Must be a number.');
    }
    const IdInt = parseInt(userId);

    if (isNaN(IdInt)) {
      throw new BadRequestException('Failed to parse Id.');
    }

    try {
      const user = await this.userService.getUserById(IdInt);
      this.userService.deepDeleteKey(user, "twoFactorAuthenticationSecret");
      this.userService.deepDeleteKey(user, "password");
    
      return user;
    } catch (error) {
      throw error
    }
  }

  /////////////////////////////////////////////
  /// WIH ID
  /////////////////////////////////////////////
  
  @UseGuards(AuthGuard('jwt'))
  @Put('me/friends/id/:friendUserId')
  async addFriendId(
    @Req() req: Request,
    @Param('friendUserId') friendUserId: string,
  ) {

    if (!/^\d+$/.test(friendUserId)) {
      throw new BadRequestException('Invalid Id. Must be a number.');
    }
    const friendUserIdInt = parseInt(friendUserId, 10);

    if (isNaN(friendUserIdInt)) {
      throw new BadRequestException('Failed to parse id');
    }
    
    const userFromId = this.getUserById(friendUserIdInt)

    try {

      const updatedUser = await this.userService.addFriend(
        req.user as User,
        (await userFromId).username,
      );
      this.userService.deepDeleteKey(updatedUser, "twoFactorAuthenticationSecret");
      this.userService.deepDeleteKey(updatedUser, "password");
      return updatedUser;
    } catch (error) {
        throw error
    }

  }

  @UseGuards(AuthGuard('jwt'))
  @Delete('me/friends/id/:friendUserId')
  async removeFriendId(
    @Req() req: Request,
    @Param('friendUserId') friendUserId: string,
  ) {


    if (!/^\d+$/.test(friendUserId)) {
      throw new BadRequestException('Invalid Id. Must be a number.');
    }
    const friendUserIdInt = parseInt(friendUserId, 10);

    if (isNaN(friendUserIdInt)) {
      throw new BadRequestException('Failed to parse id');
    }
    
    

    try {
      const userFromId = await this.userService.getUserById(friendUserIdInt);

      const updatedUser = await this.userService.removeFriend(
        req.user as User,
        (await userFromId).username,
      );
      this.userService.deepDeleteKey(updatedUser, "twoFactorAuthenticationSecret");
      this.userService.deepDeleteKey(updatedUser, "password");
      return updatedUser;
    } catch (error) {
      throw error
    }
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('profile/id/:userId')
  async getProfileId(@Param('userId') userId) {

    if (!/^\d+$/.test(userId)) {
      throw new BadRequestException('Invalid Id. Must be a number');
    }
    const userIdInt = parseInt(userId, 10);

    if (isNaN(userIdInt)) {
      throw new BadRequestException('Failed to parse id');
    }
    
    


    try {
      const userFromId = await this.userService.getUserById(userIdInt);
      const profile = await this.userService.getProfile((await userFromId).username);
      this.userService.deepDeleteKey(profile, "twoFactorAuthenticationSecret");
      this.userService.deepDeleteKey(profile, "password");
      return profile;
    } catch (error) {
      throw error
    }

  }

  @UseGuards(AuthGuard('jwt'))
  @Put('me/blocks/:blockUserId')
  async addBlockId(
    @Req() req: Request,
    @Param('blockUserId') blockUserId: string,
  ) {

    if (!/^\d+$/.test(blockUserId)) {
      throw new BadRequestException('Invalid Id. Must be a number');
    }
    const userIdInt = parseInt(blockUserId, 10);

    if (isNaN(userIdInt)) {
      throw new BadRequestException('Failed to parse id.');
    }
    



    try {
      const userFromId = await this.userService.getUserById(userIdInt);
      const updatedUser = await this.userService.addBlock(
        req.user as User,
        (await userFromId).username,
      );
      this.userService.deepDeleteKey(updatedUser, "twoFactorAuthenticationSecret");
      this.userService.deepDeleteKey(updatedUser, "password");
      return updatedUser;
    } catch (error) {
      throw error
    }

  }

  @UseGuards(AuthGuard('jwt'))
  @Delete('me/blocks/id/:blockUserId')
  async removeBlockId(
    @Req() req: Request,
    @Param('blockUserId') blockUserId: string,
  ) {

    if (!/^\d+$/.test(blockUserId)) {
      throw new BadRequestException('Invalid Id. Must be a number');
    }
    const userIdInt = parseInt(blockUserId, 10);

    if (isNaN(userIdInt)) {
      throw new BadRequestException('Failed to parse id.');
    }
    

    try {
      const userFromId = await this.userService.getUserById(userIdInt);
      const updatedUser = await this.userService.removeBlock(
        req.user as User,
        (await userFromId).username,
      );
      this.userService.deepDeleteKey(updatedUser, "twoFactorAuthenticationSecret");
      this.userService.deepDeleteKey(updatedUser, "password");
      
      return updatedUser;
    } catch (error) {
      throw error
    }

  }

  @UseGuards(AuthGuard('jwt'))
  @Get('me/blocksIds')
  async getUserBlocksIds(@Req() req: Request)
  {
    const user = req.user as User;

    const blocks = await this.userService.getUserBlocksIds(user);
    this.userService.deepDeleteKey(blocks, "twoFactorAuthenticationSecret");
    this.userService.deepDeleteKey(blocks, "password");
    return blocks;
  }
}
