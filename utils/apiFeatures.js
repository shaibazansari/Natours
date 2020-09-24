class APIFeatures{
    constructor(query,queryString){
        this.query = query
        this.queryString = queryString
    }

    filter(){
        const queryObj = {...this.queryString}
        const excludedFields = ['page','sort','limit','fields']
        excludedFields.forEach(ele => delete queryObj[ele])

        // 1B. Advanced filtering
        let queryStr = JSON.stringify(queryObj)
        queryStr =  queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`)
        // console.log(JSON.parse(queryString))

        this.query = this.query.find(JSON.parse(queryStr))
        return this
    }
    sort(){
        // 2. Sorting
        if(this.queryString.sort){
            const sortBy = this.queryString.sort.split(',').join(' ')
            this.query = this.query.sort(sortBy)
        }else{
            this.query = this.query.sort('createdAt')
        }
        return this
    }
    limitField(){
        // 3. Fields limiting
        if(this.queryString.fields){
            const fields = this.queryString.fields.split(',').join(' ')
            this.query = this.query.select(fields)
        }else{
            this.query = this.query.select('-__v')
        }
        return this
    }
    paginate(){
        // 4. Pagination
        const page = this.queryString.page*1 || 1
        const limit = this.queryString.limit*1 || 10
        const skip = (page-1)*limit

        this.query = this.query.skip(skip).limit(limit)
        return this
    }
}
module.exports = APIFeatures