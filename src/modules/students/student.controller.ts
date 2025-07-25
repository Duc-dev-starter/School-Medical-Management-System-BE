import {
    Body,
    Controller,
    Delete,
    Get,
    HttpStatus,
    Param,
    Post,
    Put,
    Query,
    Req,
    Request,
    Res,
    UploadedFile,
    UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { formatResponse } from 'src/utils';
import { CustomHttpException } from 'src/common/exceptions';
import { Public } from 'src/common/decorators/public.decorator';
import { StudentsService } from './students.service';
import { CreateStudentDTO, SearchStudentDTO, UpdateStudentDTO } from './dto';
import { Student } from './students.schema';
import { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { Multer } from 'multer';
import { UnlinkParentDTO } from './dto/unlink.dto';

@ApiTags('Students')
@Controller('api/students')
export class StudentsController {
    constructor(private readonly studentService: StudentsService) { }

    @ApiBearerAuth()
    @ApiBody({ type: CreateStudentDTO })
    @Post('create')
    async create(@Body() model: CreateStudentDTO, @Request() req) {
        console.log(model, req.user);
        const result = await this.studentService.create(model);
        return formatResponse<Student>(result);
    }

    @ApiOperation({ summary: 'Tìm kiếm học sinh có phân trang' })
    @Get('search')
    @ApiOperation({ summary: 'Tìm kiếm học sinh có phân trang' })
    @ApiQuery({ name: 'pageNum', required: false, example: 1, description: 'Trang hiện tại' })
    @ApiQuery({ name: 'pageSize', required: false, example: 10, description: 'Số lượng bản ghi mỗi trang' })
    @ApiQuery({ name: 'query', required: false })
    @ApiQuery({ name: 'classId', required: false })
    @ApiQuery({ name: 'parentId', required: false })

    @Public()
    async findAll(@Query() query: SearchStudentDTO) {
        return this.studentService.search(query);
    }


    @Public()
    @Get(':id')
    async findOne(@Param('id') id: string) {
        const result = await this.studentService.findOne(id);
        return formatResponse<Student>(result);
    }

    @Put(':id')
    @ApiBearerAuth()
    @ApiBody({ type: UpdateStudentDTO })
    async updateBlog(
        @Param('id') id: string,
        @Body() model: UpdateStudentDTO,
        @Req() req,
    ) {
        if (!model) {
            throw new CustomHttpException(
                HttpStatus.BAD_REQUEST,
                'You need to send data',
            );
        }
        const result = await this.studentService.update(id, model);
        return formatResponse<Student>(result);
    }

    @ApiBearerAuth()
    @Delete(':id')
    async remove(@Param('id') id: string, @Req() req,) {
        const result = await this.studentService.remove(id);
        return formatResponse<boolean>(result);
    }

    @ApiBearerAuth()
    @Get('export/excel')
    async exportToExcel(@Query() query: SearchStudentDTO, @Res() res: Response) {
        await this.studentService.exportToExcel(query, res);
    }

    @Post('import/excel')
    @UseInterceptors(FileInterceptor('file'))
    async importExcel(@UploadedFile() file: Multer.File) {
        return this.studentService.importStudentsFromExcel(file.buffer);
    }

    @Post('admin/unlink-parent/:studentId')
    @ApiOperation({ summary: 'Admin gỡ parent khỏi học sinh' })
    @ApiParam({ name: 'studentId', description: 'ID học sinh' })
    @ApiBody({ type: UnlinkParentDTO })
    async unlinkParent(
        @Param('studentId') studentId: string,
        @Body() body: UnlinkParentDTO
    ) {
        let result;
        result = await this.studentService.unlinkParent(studentId, body.parentType);
        return formatResponse(result);
    }
}
