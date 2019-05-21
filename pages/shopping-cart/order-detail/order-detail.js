// pages/shopping-cart/order-detail/order-detail.js
const Http = require('../../../utils/request.js');
const app = getApp();
Page({

  /**
   * 页面的初始数据
   */
  data: {
    chooseSize: false,
    animationData: {},
    items: [
      {
        name: '礼品装',
        value: 0,
      },
      {
        name: '家庭装',
        value: 1
      }
    ],
    packaeAmount: '',
    goodList: [],
    packages: [],
    totalPrice: '',
    coupons: [],
    address: [],
    remark: ''
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    console.log(options)
    this.orderDetail(options.cartIds)
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {

  },
  chooseSezi: function (e) {
    // 用that取代this，防止不必要的情况发生
    var that = this;
    // 创建一个动画实例
    var animation = wx.createAnimation({
      // 动画持续时间
      duration: 500,
      // 定义动画效果，当前是匀速
      timingFunction: 'linear'
    })
    // 将该变量赋值给当前动画
    that.animation = animation
    // 先在y轴偏移，然后用step()完成一个动画
    animation.translateY(300).step()
    // 用setData改变当前动画
    that.setData({
      // 通过export()方法导出数据
      animationData: animation.export(),
      // 改变view里面的Wx：if
      chooseSize: true
    })
    // 设置setTimeout来改变y轴偏移量，实现有感觉的滑动
    setTimeout(function () {
      animation.translateY(0).step()
      that.setData({
        animationData: animation.export()
      })
    }, 200)
  },
  hideModal: function (e) {
    var that = this;
    var animation = wx.createAnimation({
      duration: 500,
      timingFunction: 'linear'
    })
    that.animation = animation
    animation.translateY(300).step()
    that.setData({
      animationData: animation.export()

    })
    setTimeout(function () {
      animation.translateY(0).step()
      that.setData({
        animationData: animation.export(),
        chooseSize: false
      })
    }, 200)
  },
  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    this.setData({
      remark: wx.getStorageSync('remark')
    })
  },
  /**
   * 普通订单详情
   */
  orderDetail(cartIds) {
    // let params = {
    //   cartIds: cartIds
    // }
    let that = this
    Http.HttpRequst(false, '/order/orderDetail?cartIds=' + cartIds, false, '', '', 'post', false, function (res) {
      var totalPrice = 0
      if (res.state == 'ok') {
        let packages = res.data.packages
        packages[0].checked = true
        for (var i = 0;i<res.data.prds.length;i++) {
          totalPrice += res.data.prds[i].product_amount * res.data.prds[i].price;
        }
        totalPrice += packages[0].totalamount
        that.setData({
          totalPrice: totalPrice.toFixed(2),
          address: res.data.address,
          goodList: res.data.prds,
          packages: packages,
          packaeAmount: packages[0].totalamount,
          coupons: res.data.coupons,
          walletAmount: res.data.wallet
        })
      }
    })
  },
  /**
   * 包装费
   */
  radioChange(e) {
    var totalPrice = this.data.totalPrice
    totalPrice += e.detail.value
    this.setData({
      packaeAmount: e.detail.value,
      totalPrice: totalPrice
    })
  },
  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {

  },
  placeOrder() {
    var oderItem = []
    var that = this
    var size = 0
    var item = {
      productId: '',//商品id
      productPic: '',//商品效果图
      productName: '',//商品名称
      productPrice: '',//销售价格
      groupsPrice: '',//拼团价格
      productQuantity: '',//购买数量
      productWeight: '',//总重量
      productCategotyId: ''//分类id
    }
    for (var i = 0; i < that.data.goodList.length;i++) {
      size += that.data.goodList[i].product_amount
      var item = {
        productId: that.data.goodList[i].id,//商品id
        productPic: that.data.goodList[i].pic,//商品效果图
        productName: that.data.goodList[i].name,//商品名称
        productPrice: that.data.goodList[i].price,//销售价格
        groupsPrice: '',//拼团价格
        productQuantity: that.data.goodList[i].product_amount,//购买数量
        productWeight: that.data.goodList[i].weight,//总重量
        productCategotyId: that.data.goodList[i].product_category_id//分类id
      }
      oderItem.push(item)
    }
    console.log(oderItem)


    // 我们默认优先使用钱包，自动帮用户计算好。
    // 分3中情况：  1.钱包的钱 >= 待支付的钱，就不提交到微信支付；
    // 2.钱包没钱， 全部走微信支付；--- 需要提交到微信；
    // 3.钱包的钱不够，部分钱包，部分微信；--- 微信支付的部分需要提交到微信：
    var wxAmount = 0
    var walletAmount = 0
    if (that.data.walletAmount >= that.data.totalPrice) {
      wxAmount = 0
      walletAmount = that.data.walletAmount
    } else if (that.data.walletAmount == 0) {
      wxAmount = that.data.totalPrice
      walletAmount = 0
    } else if (that.data.walletAmount > 0) {
      wxAmount = that.data.totalPrice - that.data.walletAmount
      walletAmount = that.data.walletAmount
    }
    var order = {
      totalAmount: that.data.totalPrice, //订单总金额 商品数量*单价 +包装金额 +运费总额
      payAmount: that.data.totalPrice, // 应付金额 总额-优惠券
      wxAmount: wxAmount, // 微信支付金额
      walletAmount: walletAmount, //钱包支付金额
      packaeAmount: that.data.packaeAmount,//包装金额
      freightAmount: '',//运费金额
      promotionAmount: '',//促销优化金额
      couponAmount: '',//优惠券抵用金额
      receiverName: that.data.address.name, // 收货人姓名
      receiverPhone: that.data.address.phoneNumber,// 收货人电话
      receiverPostCode: '',//收货人邮编
      receiverProvince: that.data.address.province,//省份
      receiverCity: that.data.address.city,//城市
      receiverRegion: that.data.address.region,//区
      receiverDetailAddress: that.data.address.region,//详细地址
      note: that.data.remark,//备注
      couponCode:'',// 优惠券码
    }

    var params = {
      order: JSON.stringify(order),
      size: size,
      oderItem: JSON.stringify(oderItem)
    }
    console.log(params, '参数')
    Http.HttpRequst(false, '/order/order', true, '', params, 'post', false, function (res) {
      if (res.state == 'ok') {
        console.log(1)
      }
    })
  },
  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  }, 
  addRemarks() {
    wx.navigateTo({
      url: '/pages/addRemarks/addRemarks'
    })
  },
  mycoupon() {
    wx.navigateTo({
      url: '/pages/my-coupon/coupon'
    })
  }
})