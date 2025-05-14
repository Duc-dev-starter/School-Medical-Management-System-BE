import { Type } from 'class-transformer';
import { PaginationRequestModel, SearchPaginationRequestModel } from 'src/common/models';
import { SearchUserDto } from './searchUser.dto';

export class SearchWithPaginationDto extends SearchPaginationRequestModel<SearchUserDto> {
  constructor(
    pageInfo: PaginationRequestModel = { pageNum: 1, pageSize: 10 },
    searchCondition: SearchUserDto = new SearchUserDto()
  ) {
    super(pageInfo, searchCondition);
  }

  // @Type(() => SearchUserDto)
  // public searchCondition!: SearchUserDto;
}
