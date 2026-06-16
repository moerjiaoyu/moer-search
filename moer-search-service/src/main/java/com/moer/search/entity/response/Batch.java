package com.moer.search.entity.response;

import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.util.List;

@NoArgsConstructor
@Data
public class Batch implements Serializable {

//    {"took":7, "errors": false, "items":[{"index":{"_index":"test","_id":"1","_version":1,"result":"created","forced_refresh":false}}]}
    /**
     * took : 7
     * errors : false
     * items : [{"index":{"_index":"test","_id":"1","_version":1,"result":"created","forced_refresh":false}}]
     */

    private int took;
    private boolean errors;
    private List<ItemsBean> items;

    @NoArgsConstructor
    @Data
    public static class ItemsBean implements Serializable {
        /**
         * index : {"_index":"test","_id":"1","_version":1,"result":"created","forced_refresh":false}
         */

        private IndexBean index;

        @NoArgsConstructor
        @Data
        public static class IndexBean implements Serializable {
            /**
             * _index : test
             * _id : 1
             * _version : 1
             * result : created
             * forced_refresh : false
             */

            private String _index;
            private String _id;
            private int _version;
            private String result;
            private boolean forced_refresh;
        }
    }
}
