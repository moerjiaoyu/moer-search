package com.moer.search.entity.response;

import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

@NoArgsConstructor
@Data
public class Save implements Serializable {


    /**
     * _id : 8e3c6a630019473b998b9696235f27cb
     * _index : test10-1
     * _primary_term : 1
     * result : created
     * _seq_no : 4
     * _shards : {"failed":0,"successful":1,"total":2}
     * _version : 1
     * forced_refresh : true
     */

    private String _id;
    private String _index;
    private int _primary_term;
    private String result;
    private int _seq_no;
    private ShardsBean _shards;
    private int _version;
    private boolean forced_refresh;

    @NoArgsConstructor
    @Data
    public static class ShardsBean implements Serializable {
        /**
         * failed : 0
         * successful : 1
         * total : 2
         */

        private int failed;
        private int successful;
        private int total;
    }
}
