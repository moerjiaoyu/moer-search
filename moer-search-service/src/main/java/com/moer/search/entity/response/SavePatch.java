package com.moer.search.entity.response;

import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.util.List;

@NoArgsConstructor
@Data
public class SavePatch implements Serializable {


    /**
     * took : 127
     * errors : false
     * items : [{"index":{"_index":"test10-1-2023.11.15","_id":"823U0YsBbIMv_nXtuCvD","_version":1,"result":"created","forced_refresh":true,"_shards":{"total":2,"successful":1,"failed":0},"_seq_no":0,"_primary_term":1,"status":201}},{"index":{"_index":"test10-1-2023.11.15","_id":"9G3U0YsBbIMv_nXtuCvD","_version":1,"result":"created","forced_refresh":true,"_shards":{"total":2,"successful":1,"failed":0},"_seq_no":1,"_primary_term":1,"status":201}},{"index":{"_index":"test10-1-2023.11.15","_id":"9W3U0YsBbIMv_nXtuCvD","_version":1,"result":"created","forced_refresh":true,"_shards":{"total":2,"successful":1,"failed":0},"_seq_no":2,"_primary_term":1,"status":201}},{"index":{"_index":"test10-1-2023.11.15","_id":"9m3U0YsBbIMv_nXtuCvD","_version":1,"result":"created","forced_refresh":true,"_shards":{"total":2,"successful":1,"failed":0},"_seq_no":3,"_primary_term":1,"status":201}}]
     */

    private int took;
    private boolean errors;
    private List<ItemsBean> items;

    @NoArgsConstructor
    @Data
    public static class ItemsBean implements Serializable {
        /**
         * index : {"_index":"test10-1-2023.11.15","_id":"823U0YsBbIMv_nXtuCvD","_version":1,"result":"created","forced_refresh":true,"_shards":{"total":2,"successful":1,"failed":0},"_seq_no":0,"_primary_term":1,"status":201}
         */

        private IndexBean index;

        @NoArgsConstructor
        @Data
        public static class IndexBean implements Serializable {
            /**
             * _index : test10-1-2023.11.15
             * _id : 823U0YsBbIMv_nXtuCvD
             * _version : 1
             * result : created
             * forced_refresh : true
             * _shards : {"total":2,"successful":1,"failed":0}
             * _seq_no : 0
             * _primary_term : 1
             * status : 201
             */

            private String _index;
            private String _id;
            private int _version;
            private String result;
            private boolean forced_refresh;
            private ShardsBean _shards;
            private int _seq_no;
            private int _primary_term;
            private int status;

            @NoArgsConstructor
            @Data
            public static class ShardsBean implements Serializable {
                /**
                 * total : 2
                 * successful : 1
                 * failed : 0
                 */

                private int total;
                private int successful;
                private int failed;
            }
        }
    }
}
