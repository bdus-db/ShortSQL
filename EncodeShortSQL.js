/**
 * Composes ShortSQL strings using an object interface
 * 
 * Example:
 * const test = new EncodeShortSQL('manuscripts');
 * test.setField('id', 'ID');
 * test.setField('cmclid', 'CMCL');
 * test.setWhere('cmclid', 'like', 'ciao');
 * test.setWhere('cmclid', 'like', 'ciao', 'and');
 * test.setJoin('geodata', [
 *          ['places.id', '=', '^paths__geodata.id_link'],
 *          ['geodata.table_link', '=', 'paths__places', 'and']
 *  ]);
 * test.setOrder('cmclid');
 * test.setOrder('cmclid2:desc');
 * test.setLimit(0, 10);
 * test.setGroup('cmcl');
 * 
 * const shortString = test.getShortSql();
 * // => @manuscripts~+geodata||places.id|=|^paths__geodata.id_link||and|geodata.table_link|=|paths__places~[id:ID,cmclid:CMCL~?cmclid|like|ciao||and|cmclid|like|ciao~>cmclid~>cmclid2:desc~-0:10~[cmcl
 * const shortStringUrlSafe = test.getShortSql(true);
 * // => @manuscripts~+geodata%7C%7Cplaces.id%7C=%7C%5Epaths__geodata.id_link%7C%7Cand%7Cgeodata.table_link%7C=%7Cpaths__places~%5Bid:ID,cmclid:CMCL~?cmclid%7Clike%7Cciao%7C%7Cand%7Ccmclid%7Clike%7Cciao~%3Ecmclid~%3Ecmclid2:desc~-0:10~%5Bcmcl

 */
class EncodeShortSQL {
    
    tb = false;
    fields = [];
    joins = [];
    where = [];
    order = [];
    limit = false;
    group = [];
    
    constructor(tb){
        this.tb = tb;
    }

    setField(fld, alias) {
        const fldStr = fld + (alias ? ':' + alias : '');
        this.fields.push(fldStr)
    }

    setJoin(tb, onStatement) {
        let part = [tb];
        onStatement.forEach(stat => {
            const fld   = stat[0];
            const op    = stat[1];
            const val   = stat[2];
            const conn  = stat[3];

            const partial_str = (conn ? conn + '|' : '') + [fld, op, val].join('|');

            part.push(partial_str);
        });
        this.joins.push(part.join('||'));
    }

    setWhere(fld, op, val, conn) {
        if (this.where.length < 1 && conn) {
            throw "No connector is required on first where statement";
        }
        
        if (this.where.length > 0 && !conn) {
            throw "Connector is required on second and above statement";
        }
        
        let w = conn ? `${conn}|`: '';
        w = `${w}${fld}|${op}|${val}`;
        this.where.push(w);
    }

    setOrder(fld, dir) {
        const order = fld + (dir ? ':dir' : '');
        this.order.push(order);
    }

    setLimit (tot, offset) {
        this.limit = tot + (offset ? `:${offset}` : '');
    }

    setGroup(fld) {
        this.group.push(fld);
    }



    getShortSql(encode){
        let sSQL = [];

        
        // Table
        sSQL.push(`@${this.tb}`);

        if (this.joins.length > 0) {
            this.joins.forEach( o => {
                sSQL.push(`+${o}`);
            });
        }

        // Fields
        if (this.fields.length > 0) {
            sSQL.push(`[${this.fields.join(',')}`);
        }
        
        // Where
        if (this.where.length > 0){
            sSQL.push('?' + this.where.join('||'));
        }

        // Order
        if (this.order.length > 0){
            this.order.forEach( o => {
                sSQL.push(`>${o}`);
            });
        }

        // Limit
        if (this.limit){
            sSQL.push(`-${this.limit}`);
        }

        // Group
        if (this.group.length > 0) {
            sSQL.push(`[${this.group.join(',')}`);
        }

        const string = sSQL.join('~');

        return encode ? encodeURI(string) : string;
    }

}

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    module.exports = EncodeShortSQL;
} else {
    window.Matrix = EncodeShortSQL;
}
